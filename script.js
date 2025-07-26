// DOM要素の取得
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navbar = document.querySelector('.navbar');
const contactForm = document.getElementById('contactForm');

// ハンバーガーメニューの制御
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// ナビゲーションリンクをクリックした時にメニューを閉じる
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// スクロール時のナビゲーション効果
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// スムーススクロール
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80; // ナビゲーションの高さ分調整
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// フォーム送信処理
contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // フォームデータの取得
    const formData = new FormData(this);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message')
    };
    
    // ここで実際の送信処理を行う（例：fetch APIを使用）
    console.log('Contact form submitted:', data);
    
    // 成功メッセージの表示
    alert('お問い合わせありがとうございます！内容を確認後、ご連絡いたします。');
    
    // フォームのリセット
    this.reset();
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

// アニメーション要素の監視
document.querySelectorAll('.class-card, .about-content, .contact-form').forEach(el => {
    observer.observe(el);
});

// ページ読み込み完了時の処理
document.addEventListener('DOMContentLoaded', function() {
    // ローディングアニメーション
    const loader = document.querySelector('.loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }, 500);
    }

    // ヒーローセクションのアニメーション
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.classList.add('loaded');
    }

    // フォントの最適化読み込み
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Dancing+Script:wght@400;600;700&display=swap';
    document.head.appendChild(fontLink);
});

// レスポンシブ対応
function handleResize() {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    
    // モバイルビューポートの調整
    if (vw <= 768) {
        document.body.classList.add('mobile');
    } else {
        document.body.classList.remove('mobile');
    }
}

window.addEventListener('resize', handleResize);
handleResize(); // 初期実行

// エラーハンドリング
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
});

// パフォーマンス監視
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('Page Load Time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
        }, 0);
    });
}

// スケジュール表示の更新
function updateSchedule() {
    // 静的なスケジュール情報
    const schedule = {
        monday: [
            { time: '09:00-10:00', class: 'ハタヨガ', instructor: '田中先生' },
            { time: '18:00-19:00', class: 'パワーヨガ', instructor: '佐藤先生' }
        ],
        tuesday: [
            { time: '10:00-11:00', class: 'リストラティブヨガ', instructor: '鈴木先生' },
            { time: '19:00-20:00', class: 'ハタヨガ', instructor: '田中先生' }
        ],
        wednesday: [
            { time: '09:00-10:00', class: 'パワーヨガ', instructor: '佐藤先生' },
            { time: '18:00-19:00', class: 'リストラティブヨガ', instructor: '鈴木先生' }
        ],
        thursday: [
            { time: '10:00-11:00', class: 'ハタヨガ', instructor: '田中先生' },
            { time: '19:00-20:00', class: 'パワーヨガ', instructor: '佐藤先生' }
        ],
        friday: [
            { time: '09:00-10:00', class: 'リストラティブヨガ', instructor: '鈴木先生' },
            { time: '18:00-19:00', class: 'ハタヨガ', instructor: '田中先生' }
        ],
        saturday: [
            { time: '10:00-11:00', class: 'パワーヨガ', instructor: '佐藤先生' },
            { time: '14:00-15:00', class: 'ハタヨガ', instructor: '田中先生' }
        ],
        sunday: [
            { time: '10:00-11:00', class: 'リストラティブヨガ', instructor: '鈴木先生' }
        ]
    };

    // スケジュール表示の更新
    Object.keys(schedule).forEach(day => {
        const dayElement = document.querySelector(`[data-day="${day}"]`);
        if (dayElement) {
            const classList = dayElement.querySelector('.class-list');
            if (classList) {
                classList.innerHTML = schedule[day].map(item => `
                    <div class="class-item">
                        <span class="time">${item.time}</span>
                        <span class="class-name">${item.class}</span>
                        <span class="instructor">${item.instructor}</span>
                    </div>
                `).join('');
            }
        }
    });
}

// ===== 予約システム =====

// 予約データの管理（ローカルストレージのみ）
class ReservationManager {
    constructor() {
        this.storageKey = 'yoga_reservations';
        this.init();
    }

    init() {
        // モーダル要素の取得
        this.bookingModal = document.getElementById('bookingModal');
        this.confirmationModal = document.getElementById('confirmationModal');
        this.reservationsModal = document.getElementById('reservationsModal');
        
        // フォーム要素の取得
        this.bookingForm = document.getElementById('bookingForm');
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // 日付の初期設定
        this.setupDateConstraints();
    }

    setupEventListeners() {
        // 予約ボタンのクリックイベント
        document.querySelectorAll('.book-class-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.openBookingModal(e));
        });

        // モーダルを閉じるイベント
        document.querySelectorAll('.close').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e));
        });

        // キャンセルボタン
        document.querySelector('.cancel-booking')?.addEventListener('click', () => {
            this.closeModal();
        });

        // 予約フォームの送信
        this.bookingForm?.addEventListener('submit', (e) => this.handleBookingSubmit(e));

        // 予約確認フォーム
        document.getElementById('reservationSearchForm')?.addEventListener('submit', (e) => {
            this.handleReservationSearch(e);
        });

        // 外部クリックでモーダルを閉じる
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e);
            }
        });
    }

    setupDateConstraints() {
        const dateInput = document.getElementById('bookingDate');
        if (dateInput) {
            // 今日以降の日付のみ選択可能
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const yyyy = today.getFullYear();
            
            dateInput.min = `${yyyy}-${mm}-${dd}`;
            
            // 3ヶ月先まで予約可能
            const maxDate = new Date();
            maxDate.setMonth(maxDate.getMonth() + 3);
            const maxDd = String(maxDate.getDate()).padStart(2, '0');
            const maxMm = String(maxDate.getMonth() + 1).padStart(2, '0');
            const maxYyyy = maxDate.getFullYear();
            
            dateInput.max = `${maxYyyy}-${maxMm}-${maxDd}`;
        }
    }

    openBookingModal(e) {
        e.preventDefault();
        const button = e.target.closest('.book-class-btn');
        const classType = button.dataset.class;
        
        // フォームにクラス情報を設定
        document.getElementById('bookingClass').value = classType;
        
        // モーダルを表示
        this.bookingModal.style.display = 'block';
        setTimeout(() => {
            this.bookingModal.classList.add('show');
        }, 10);
    }

    closeModal(e = null) {
        const modals = [this.bookingModal, this.confirmationModal, this.reservationsModal];
        
        modals.forEach(modal => {
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    }

    async handleBookingSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.bookingForm);
        const bookingData = {
            id: this.generateBookingId(),
            class: formData.get('class'),
            date: formData.get('date'),
            time: formData.get('time'),
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            notes: formData.get('notes') || '',
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        // バリデーション
        if (!this.validateBookingData(bookingData)) {
            return;
        }

        // 重複チェック
        if (this.checkDuplicateBooking(bookingData)) {
            alert('同じ日時・クラスの予約が既に存在します。');
            return;
        }

        try {
            // ローディング表示
            const submitBtn = this.bookingForm.querySelector('.submit-booking');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '予約中...';
            submitBtn.disabled = true;

            // 予約保存（ローカルストレージ）
            await this.saveReservation(bookingData);

            // 成功時の処理
            this.bookingForm.reset();
            this.closeModal();
            this.showConfirmation(bookingData);

            // ボタンを元に戻す
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;

        } catch (error) {
            console.error('Booking error:', error);
            alert('予約の処理中にエラーが発生しました。もう一度お試しください。');
            
            // ボタンを元に戻す
            const submitBtn = this.bookingForm.querySelector('.submit-booking');
            submitBtn.textContent = '予約する';
            submitBtn.disabled = false;
        }
    }

    validateBookingData(data) {
        const errors = [];
        
        if (!data.class) errors.push('クラスを選択してください');
        if (!data.date) errors.push('日付を選択してください');
        if (!data.time) errors.push('時間を選択してください');
        if (!data.name || data.name.trim().length < 2) errors.push('お名前を正しく入力してください');
        if (!data.email || !this.isValidEmail(data.email)) errors.push('有効なメールアドレスを入力してください');
        if (!data.phone || data.phone.trim().length < 10) errors.push('電話番号を正しく入力してください');

        if (errors.length > 0) {
            alert('入力エラー:\n' + errors.join('\n'));
            return false;
        }
        
        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    checkDuplicateBooking(newBooking) {
        const reservations = this.getReservations();
        return reservations.some(reservation => 
            reservation.email === newBooking.email &&
            reservation.date === newBooking.date &&
            reservation.class === newBooking.class &&
            reservation.status === 'confirmed'
        );
    }

    generateBookingId() {
        return 'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    saveReservation(bookingData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const reservations = this.getReservations();
                reservations.push(bookingData);
                localStorage.setItem(this.storageKey, JSON.stringify(reservations));
                resolve({ success: true, id: bookingData.id });
            }, 1500); // 処理時間をシミュレート
        });
    }

    showConfirmation(bookingData) {
        const classNames = {
            'hatha': 'ハタヨガ',
            'power': 'パワーヨガ',
            'restorative': 'リストラティブヨガ'
        };

        const confirmationDetails = document.getElementById('confirmationDetails');
        if (confirmationDetails) {
            confirmationDetails.innerHTML = `
                <p><strong>予約ID:</strong> ${bookingData.id}</p>
                <p><strong>クラス:</strong> ${classNames[bookingData.class] || bookingData.class}</p>
                <p><strong>日付:</strong> ${this.formatDate(bookingData.date)}</p>
                <p><strong>時間:</strong> ${bookingData.time}</p>
                <p><strong>お名前:</strong> ${bookingData.name}</p>
                <p><strong>メール:</strong> ${bookingData.email}</p>
                <p><strong>電話番号:</strong> ${bookingData.phone}</p>
                ${bookingData.notes ? `<p><strong>備考:</strong> ${bookingData.notes}</p>` : ''}
            `;
        }

        this.confirmationModal.style.display = 'block';
        setTimeout(() => {
            this.confirmationModal.classList.add('show');
        }, 10);
    }

    handleReservationSearch(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        
        if (!email) {
            alert('メールアドレスを入力してください');
            return;
        }

        this.searchReservations(email);
    }

    searchReservations(email) {
        const reservations = this.getReservations();
        const userReservations = reservations.filter(r => 
            r.email.toLowerCase() === email.toLowerCase() && r.status === 'confirmed'
        );

        this.displayReservations(userReservations);
    }

    displayReservations(reservations) {
        const container = document.getElementById('reservationsList');
        
        if (reservations.length === 0) {
            container.innerHTML = '<p class="no-reservations">予約が見つかりませんでした。</p>';
        } else {
            const classNames = {
                'hatha': 'ハタヨガ',
                'power': 'パワーヨガ',
                'restorative': 'リストラティブヨガ'
            };

            container.innerHTML = reservations.map(reservation => `
                <div class="reservation-item" data-id="${reservation.id}">
                    <div class="reservation-header">
                        <span class="reservation-id">ID: ${reservation.id}</span>
                        <span class="reservation-date">${this.formatDate(reservation.date)}</span>
                    </div>
                    <div class="reservation-details">
                        <p><strong>クラス:</strong> ${classNames[reservation.class] || reservation.class}</p>
                        <p><strong>時間:</strong> ${reservation.time}</p>
                        <p><strong>ステータス:</strong> <span class="status-${reservation.status}">確認済み</span></p>
                        ${reservation.notes ? `<p><strong>備考:</strong> ${reservation.notes}</p>` : ''}
                    </div>
                    <div class="reservation-actions">
                        ${this.canCancelReservation(reservation) ? 
                            `<button class="cancel-reservation-btn" data-id="${reservation.id}">キャンセル</button>` : 
                            `<span class="cancel-note">キャンセル期限を過ぎています</span>`
                        }
                    </div>
                </div>
            `).join('');

            // キャンセルボタンのイベントリスナー追加
            container.querySelectorAll('.cancel-reservation-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.cancelReservation(e.target.dataset.id));
            });
        }

        this.reservationsModal.style.display = 'block';
        setTimeout(() => {
            this.reservationsModal.classList.add('show');
        }, 10);
    }

    canCancelReservation(reservation) {
        const reservationDate = new Date(reservation.date);
        const now = new Date();
        const hoursDiff = (reservationDate - now) / (1000 * 60 * 60);
        return hoursDiff > 24; // 24時間前まで
    }

    cancelReservation(reservationId) {
        if (!confirm('本当にこの予約をキャンセルしますか？')) {
            return;
        }

        const reservations = this.getReservations();
        const reservationIndex = reservations.findIndex(r => r.id === reservationId);
        
        if (reservationIndex !== -1) {
            reservations[reservationIndex].status = 'cancelled';
            reservations[reservationIndex].cancelledAt = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(reservations));
            
            alert('予約をキャンセルしました。');
            
            // 表示を更新
            const reservationElement = document.querySelector(`[data-id="${reservationId}"]`);
            if (reservationElement) {
                reservationElement.remove();
            }
        }
    }

    getReservations() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    formatDate(dateString) {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        };
        return new Date(dateString).toLocaleDateString('ja-JP', options);
    }
}

// Service Worker registration (PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// ページ読み込み時に予約システムを初期化
document.addEventListener('DOMContentLoaded', () => {
    updateSchedule();
    
    // 予約システムの初期化
    if (document.getElementById('bookingModal')) {
        new ReservationManager();
    }
});
