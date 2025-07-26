"""
予約データの管理とバリデーションを行うモジュール
"""
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from pydantic import BaseModel, EmailStr, validator
import pytz


# データモデルの定義
class ReservationRequest(BaseModel):
    """予約リクエストのデータモデル"""
    class_type: str
    schedule: str
    date: str  # YYYY-MM-DD形式
    name: str
    email: EmailStr
    phone: str
    notes: Optional[str] = ""
    
    @validator('class_type')
    def validate_class_type(cls, v):
        allowed_types = ['hatha', 'power', 'restorative']
        if v not in allowed_types:
            raise ValueError(f'Class type must be one of: {allowed_types}')
        return v
    
    @validator('date')
    def validate_date(cls, v):
        try:
            # 日付の形式チェック
            date_obj = datetime.strptime(v, '%Y-%m-%d')
            
            # 過去の日付はNG
            today = datetime.now(pytz.timezone('Asia/Tokyo')).date()
            if date_obj.date() < today:
                raise ValueError('Cannot book for past dates')
            
            # 3ヶ月先までの制限
            max_date = today + timedelta(days=90)
            if date_obj.date() > max_date:
                raise ValueError('Cannot book more than 3 months in advance')
                
            return v
        except ValueError as e:
            if 'time data' in str(e):
                raise ValueError('Date must be in YYYY-MM-DD format')
            raise e
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Name is required')
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters')
        return v.strip()
    
    @validator('phone')
    def validate_phone(cls, v):
        if not v or not v.strip():
            raise ValueError('Phone number is required')
        # 日本の電話番号の簡単なバリデーション
        cleaned = v.replace('-', '').replace(' ', '').replace('(', '').replace(')', '')
        if not cleaned.isdigit() or len(cleaned) < 10:
            raise ValueError('Invalid phone number format')
        return v.strip()


@dataclass
class Reservation:
    """予約データのデータクラス"""
    id: str
    class_type: str
    schedule: str
    date: str
    name: str
    email: str
    phone: str
    notes: str
    status: str = 'confirmed'  # confirmed, cancelled
    created_at: str = None
    updated_at: str = None
    cancelled_at: Optional[str] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now(pytz.timezone('Asia/Tokyo')).isoformat()
        if self.updated_at is None:
            self.updated_at = self.created_at
    
    def to_dict(self) -> Dict[str, Any]:
        """辞書形式に変換"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Reservation':
        """辞書から予約オブジェクトを作成"""
        return cls(**data)
    
    def update_status(self, status: str):
        """ステータスを更新"""
        self.status = status
        self.updated_at = datetime.now(pytz.timezone('Asia/Tokyo')).isoformat()
        if status == 'cancelled':
            self.cancelled_at = self.updated_at
    
    def can_cancel(self) -> bool:
        """キャンセル可能かチェック（24時間前まで）"""
        if self.status != 'confirmed':
            return False
        
        try:
            reservation_datetime = datetime.strptime(self.date, '%Y-%m-%d')
            now = datetime.now(pytz.timezone('Asia/Tokyo')).replace(tzinfo=None)
            hours_diff = (reservation_datetime - now).total_seconds() / 3600
            return hours_diff > 24
        except ValueError:
            return False


class ReservationManager:
    """予約データの管理クラス"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.jst = pytz.timezone('Asia/Tokyo')
    
    def generate_reservation_id(self) -> str:
        """予約IDを生成"""
        import secrets
        import string
        timestamp = datetime.now(self.jst).strftime('%Y%m%d%H%M%S')
        random_suffix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
        return f"YG{timestamp}{random_suffix}"
    
    def create_reservation(self, request: ReservationRequest) -> Reservation:
        """新規予約を作成"""
        reservation_id = self.generate_reservation_id()
        
        reservation = Reservation(
            id=reservation_id,
            class_type=request.class_type,
            schedule=request.schedule,
            date=request.date,
            name=request.name,
            email=request.email,
            phone=request.phone,
            notes=request.notes or ""
        )
        
        self.logger.info(f"Created reservation: {reservation_id}")
        return reservation
    
    def validate_no_duplicate(self, reservations: List[Reservation], new_reservation: Reservation) -> bool:
        """重複予約のチェック"""
        for reservation in reservations:
            if (reservation.email.lower() == new_reservation.email.lower() and
                reservation.date == new_reservation.date and
                reservation.class_type == new_reservation.class_type and
                reservation.status == 'confirmed'):
                return False
        return True
    
    def filter_reservations(self, reservations: List[Reservation], 
                          email: Optional[str] = None,
                          date: Optional[str] = None,
                          status: Optional[str] = None) -> List[Reservation]:
        """予約データのフィルタリング"""
        filtered = reservations
        
        if email:
            filtered = [r for r in filtered if r.email.lower() == email.lower()]
        
        if date:
            filtered = [r for r in filtered if r.date == date]
        
        if status:
            filtered = [r for r in filtered if r.status == status]
        
        return filtered
    
    def sort_reservations(self, reservations: List[Reservation], 
                         sort_by: str = 'date', 
                         descending: bool = False) -> List[Reservation]:
        """予約データのソート"""
        if sort_by == 'date':
            return sorted(reservations, 
                         key=lambda x: x.date, 
                         reverse=descending)
        elif sort_by == 'created_at':
            return sorted(reservations, 
                         key=lambda x: x.created_at, 
                         reverse=descending)
        else:
            return reservations
    
    def get_class_name_jp(self, class_type: str) -> str:
        """クラスタイプの日本語名を取得"""
        class_names = {
            'hatha': 'ハタヨガ',
            'power': 'パワーヨガ',
            'restorative': 'リストラティブヨガ'
        }
        return class_names.get(class_type, class_type)
    
    def format_date_jp(self, date_str: str) -> str:
        """日付を日本語形式でフォーマット"""
        try:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            weekdays = ['月', '火', '水', '木', '金', '土', '日']
            weekday = weekdays[date_obj.weekday()]
            return f"{date_obj.year}年{date_obj.month}月{date_obj.day}日({weekday})"
        except ValueError:
            return date_str
