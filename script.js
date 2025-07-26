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
        phone: formData.get('phone'),
        interest: formData.get('interest'),
        message: formData.get('message')
    };
    
    // バリデーション
    if (!validateForm(data)) {
        return;
    }
    
    // 送信ボタンの状態変更
    const submitBtn = this.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '送信中...';
    submitBtn.disabled = true;
    
    // 実際の送信処理をシミュレート（3秒後に完了）
    setTimeout(() => {
        showSuccessMessage();
        this.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 3000);
});

// フォームバリデーション
function validateForm(data) {
    const errors = [];
    
    if (!data.name.trim()) {
        errors.push('お名前を入力してください。');
    }
    
    if (!data.email.trim()) {
        errors.push('メールアドレスを入力してください。');
    } else if (!isValidEmail(data.email)) {
        errors.push('有効なメールアドレスを入力してください。');
    }
    
    if (errors.length > 0) {
        showErrorMessage(errors);
        return false;
    }
    
    return true;
}

// メールアドレスの形式チェック
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// エラーメッセージの表示
function showErrorMessage(errors) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-error';
    errorDiv.innerHTML = `
        <div style="background: #fee; border: 1px solid #fcc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; color: #c33;">
            <strong>入力エラー:</strong>
            <ul style="margin: 0.5rem 0 0 1rem;">
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        </div>
    `;
    
    const form = document.querySelector('.contact-form');
    const existingAlert = form.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    form.insertBefore(errorDiv, form.firstChild);
    
    // 3秒後に自動削除
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// 成功メッセージの表示
function showSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success';
    successDiv.innerHTML = `
        <div style="background: #efe; border: 1px solid #cfc; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; color: #363;">
            <strong>送信完了!</strong> お問い合わせいただきありがとうございます。24時間以内にご返信いたします。
        </div>
    `;
    
    const form = document.querySelector('.contact-form');
    const existingAlert = form.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    form.insertBefore(successDiv, form.firstChild);
    
    // 5秒後に自動削除
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
}

// 要素が画面に入った時のアニメーション
function animateOnScroll() {
    const observers = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // アニメーション対象の要素を選択
    const animatedElements = document.querySelectorAll(`
        .feature-card,
        .class-card,
        .instructor-card,
        .pricing-card,
        .testimonial-card,
        .about-stats .stat
    `);
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease-out';
        observers.observe(el);
    });
}

// 統計カウンターアニメーション
function animateCounters() {
    const counters = document.querySelectorAll('.stat h3');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.textContent.replace(/\D/g, ''));
                const suffix = counter.textContent.replace(/\d/g, '');
                
                animateCounter(counter, 0, target, 2000, suffix);
                observer.unobserve(counter);
            }
        });
    });
    
    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element, start, end, duration, suffix) {
    const range = end - start;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (range * easeOutQuart(progress)));
        element.textContent = current + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function easeOutQuart(t) {
    return 1 - (--t) * t * t * t;
}

// 画像の遅延読み込み（将来の実装のため）
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// ページ読み込み時に実行される処理
document.addEventListener('DOMContentLoaded', function() {
    // アニメーションの初期化
    animateOnScroll();
    animateCounters();
    
    // 遅延読み込みの初期化
    lazyLoadImages();
    
    // パフォーマンス向上のためのプリロード
    preloadCriticalResources();
    
    // アクセシビリティの向上
    improveAccessibility();
});

// 重要なリソースのプリロード
function preloadCriticalResources() {
    // フォントファイルのプリロード
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=Dancing+Script:wght@400;600;700&display=swap';
    fontLink.as = 'style';
    document.head.appendChild(fontLink);
}

// アクセシビリティの向上
function improveAccessibility() {
    // キーボードナビゲーションの改善
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // ESCキーでメニューを閉じる
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    });
    
    // フォーカスの可視性を向上
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });
}

// リサイズイベントの最適化
let resizeTimer;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
        // リサイズ時の処理
        handleResize();
    }, 250);
});

function handleResize() {
    // モバイルメニューが開いている状態でデスクトップサイズになった場合の処理
    if (window.innerWidth > 768) {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    }
}

// エラーハンドリング
window.addEventListener('error', function(e) {
    console.error('JavaScript Error:', e.error);
    // エラーを目立たないように処理
});

// PWA対応の準備（将来の実装のため）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Service Workerの登録（実際のファイルが作成されたときに有効化）
        // navigator.serviceWorker.register('/sw.js');
    });
}

// クラススケジュールの動的更新（将来の実装のため）
function updateClassSchedule() {
    // APIからクラススケジュールを取得して更新
    // 実際のバックエンドAPIと連携する際に実装
}

// 予約システムとの連携（将来の実装のため）
function bookClass(classId) {
    // 予約システムAPIと連携
    console.log('Booking class:', classId);
}

// Google Analytics（将来の実装のため）
function initAnalytics() {
    // Google Analytics 4の初期化
    // gtag('config', 'GA_MEASUREMENT_ID');
}

// チャットボット（将来の実装のため）
function initChatbot() {
    // チャットボットの初期化
    // お客様サポート用のチャット機能
}

// ===== 予約システム =====

// 予約データの管理
class ReservationManager {
    constructor() {
        this.storageKey = 'yoga_reservations';
        this.apiEndpoint = '/api'; // Azure Static Web Apps API endpoint
        this.isProduction = window.location.hostname !== 'localhost' && 
                          window.location.hostname !== '127.0.0.1';
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
        
        // Service Worker の登録（本番環境のみ）
        if (this.isProduction && 'serviceWorker' in navigator) {
            this.registerServiceWorker();
        }
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

        // 予約フォーム送信
        this.bookingForm?.addEventListener('submit', (e) => this.submitBooking(e));

        // 確認モーダルのボタン
        document.querySelector('.close-confirmation')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.querySelector('.view-reservations')?.addEventListener('click', () => {
            this.closeModal();
            this.openReservationsModal();
        });

        // 予約確認リンク
        document.getElementById('myReservationsLink')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openReservationsModal();
        });

        // 予約検索
        document.querySelector('.search-reservations')?.addEventListener('click', () => {
            this.searchReservations();
        });

        // モーダル外クリックで閉じる
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });
    }

    setupDateConstraints() {
        const dateInput = document.getElementById('bookingDate');
        if (dateInput) {
            // 今日より前の日付は選択できないように
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            
            // 3ヶ月先まで予約可能
            const maxDate = new Date();
            maxDate.setMonth(maxDate.getMonth() + 3);
            dateInput.max = maxDate.toISOString().split('T')[0];
        }
    }

    openBookingModal(event) {
        const button = event.target.closest('.book-class-btn');
        const className = button.dataset.class;
        const schedule = button.dataset.schedule;
        
        // クラス情報を表示
        const classNames = {
            'hatha': 'ハタヨガ',
            'power': 'パワーヨガ',
            'restorative': 'リストラティブヨガ'
        };
        
        document.getElementById('selectedClass').textContent = classNames[className] || className;
        document.getElementById('selectedSchedule').textContent = schedule;
        
        // モーダルを表示
        this.bookingModal.style.display = 'block';
        
        // フォームにクラス情報を保存
        this.bookingForm.dataset.className = className;
        this.bookingForm.dataset.schedule = schedule;
    }

    closeModal() {
        this.bookingModal.style.display = 'none';
        this.confirmationModal.style.display = 'none';
        this.reservationsModal.style.display = 'none';
    }

    async submitBooking(event) {
        event.preventDefault();
        
        const formData = new FormData(this.bookingForm);
        const bookingData = {
            id: this.generateBookingId(),
            class: this.bookingForm.dataset.className,
            schedule: this.bookingForm.dataset.schedule,
            date: formData.get('bookingDate'),
            name: formData.get('bookingName'),
            email: formData.get('bookingEmail'),
            phone: formData.get('bookingPhone'),
            notes: formData.get('bookingNotes'),
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        // バリデーション
        if (!this.validateBooking(bookingData)) {
            return;
        }

        // 予約の重複チェック
        if (this.checkDuplicateBooking(bookingData)) {
            alert('同じ日時に既に予約があります。別の日時を選択してください。');
            return;
        }

        // ローディング状態
        const submitBtn = this.bookingForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '予約処理中...';
        submitBtn.disabled = true;

        try {
            // 予約を保存
            await this.saveReservation(bookingData);
            
            // 確認メールをシミュレート
            await this.sendConfirmationEmail(bookingData);
            
            // 成功モーダルを表示
            this.showConfirmation(bookingData);
            
            // フォームをリセット
            this.bookingForm.reset();
            
        } catch (error) {
            alert('予約処理中にエラーが発生しました。もう一度お試しください。');
            console.error('Booking error:', error);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    validateBooking(data) {
        const errors = [];
        
        if (!data.date) errors.push('日付を選択してください');
        if (!data.name.trim()) errors.push('お名前を入力してください');
        if (!data.email.trim()) errors.push('メールアドレスを入力してください');
        if (!data.phone.trim()) errors.push('電話番号を入力してください');
        
        // 日付が過去でないかチェック
        const selectedDate = new Date(data.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            errors.push('過去の日付は選択できません');
        }

        if (errors.length > 0) {
            alert('入力エラー:\n' + errors.join('\n'));
            return false;
        }
        
        return true;
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
        // Azure Static Web Apps 環境では Function App API を使用
        if (this.isProduction) {
            return this.sendToFunctionAPI('POST', '/api/reservations', bookingData);
        }
        
        // 開発環境ではローカルストレージを使用
        return new Promise((resolve) => {
            setTimeout(() => {
                const reservations = this.getReservations();
                reservations.push(bookingData);
                localStorage.setItem(this.storageKey, JSON.stringify(reservations));
                resolve({ success: true, id: bookingData.id });
            }, 1500); // 処理時間をシミュレート
        });
    }

    sendConfirmationEmail(bookingData) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Confirmation email sent to:', bookingData.email);
                resolve();
            }, 500);
        });
    }

    showConfirmation(bookingData) {
        const classNames = {
            'hatha': 'ハタヨガ',
            'power': 'パワーヨガ',
            'restorative': 'リストラティブヨガ'
        };

        const confirmationDetails = document.getElementById('confirmationDetails');
        confirmationDetails.innerHTML = `
            <p><strong>予約ID:</strong> ${bookingData.id}</p>
            <p><strong>クラス:</strong> ${classNames[bookingData.class]}</p>
            <p><strong>日時:</strong> ${this.formatDate(bookingData.date)}</p>
            <p><strong>お名前:</strong> ${bookingData.name}</p>
            <p><strong>メール:</strong> ${bookingData.email}</p>
            ${bookingData.notes ? `<p><strong>備考:</strong> ${bookingData.notes}</p>` : ''}
        `;

        this.bookingModal.style.display = 'none';
        this.confirmationModal.style.display = 'block';
    }

    openReservationsModal() {
        this.reservationsModal.style.display = 'block';
        
        // 検索フィールドをクリア
        document.getElementById('searchEmail').value = '';
        document.getElementById('reservationsList').innerHTML = '<p class="no-reservations"><i class="fas fa-search"></i><br>メールアドレスを入力して予約を検索してください</p>';
    }

    searchReservations() {
        const email = document.getElementById('searchEmail').value.trim();
        
        if (!email) {
            alert('メールアドレスを入力してください');
            return;
        }

        // 本番環境ではFunction App APIから取得
        if (this.isProduction) {
            this.searchReservationsFromAPI(email);
        } else {
            // 開発環境ではローカルストレージから取得
            const reservations = this.getReservations();
            const userReservations = reservations
                .filter(r => r.email.toLowerCase() === email.toLowerCase())
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            this.displayReservations(userReservations);
        }
    }

    async searchReservationsFromAPI(email) {
        try {
            const response = await this.sendToFunctionAPI('GET', `/api/reservations?email=${encodeURIComponent(email)}`);
            
            if (response.status === 'success') {
                this.displayReservations(response.data);
            } else {
                throw new Error(response.message || 'Failed to search reservations');
            }
        } catch (error) {
            console.error('Error searching reservations:', error);
            alert('予約検索中にエラーが発生しました。もう一度お試しください。');
        }
    }

    displayReservations(reservations) {
        const container = document.getElementById('reservationsList');
        
        if (reservations.length === 0) {
            container.innerHTML = `
                <div class="no-reservations">
                    <i class="fas fa-calendar-times"></i>
                    <h4>予約が見つかりませんでした</h4>
                    <p>入力されたメールアドレスでの予約が見つかりません。</p>
                </div>
            `;
            return;
        }

        const classNames = {
            'hatha': 'ハタヨガ',
            'power': 'パワーヨガ',
            'restorative': 'リストラティブヨガ'
        };

        container.innerHTML = reservations.map(reservation => `
            <div class="reservation-item">
                <div class="reservation-header">
                    <div>
                        <div class="reservation-class">${classNames[reservation.class]}</div>
                        <div class="reservation-date">${this.formatDate(reservation.date)}</div>
                    </div>
                    <span class="reservation-status status-${reservation.status}>
                        ${reservation.status === 'confirmed' ? '予約確定' : 'キャンセル済み'}
                    </span>
                </div>
                <div class="reservation-details">
                    <div class="detail-item">
                        <strong>予約ID</strong>
                        ${reservation.id}
                    </div>
                    <div class="detail-item">
                        <strong>お名前</strong>
                        ${reservation.name}
                    </div>
                    <div class="detail-item">
                        <strong>電話番号</strong>
                        ${reservation.phone}
                    </div>
                    <div class="detail-item">
                        <strong>予約日時</strong>
                        ${this.formatDateTime(reservation.createdAt)}
                    </div>
                </div>
                ${reservation.notes ? `<p><strong>備考:</strong> ${reservation.notes}</p>` : ''}
                <div class="reservation-actions">
                    ${reservation.status === 'confirmed' && this.canCancelReservation(reservation) ? 
                        `<button class="btn btn-outline" onclick="reservationManager.cancelReservation('${reservation.id}')">
                            <i class="fas fa-times"></i> キャンセル
                        </button>` : ''
                    }
                    ${reservation.status === 'confirmed' ? 
                        `<button class="btn btn-secondary" onclick="reservationManager.rescheduleReservation('${reservation.id}')">
                            <i class="fas fa-edit"></i> 変更
                        </button>` : ''
                    }
                </div>
            </div>
        `).join('');
    }

    canCancelReservation(reservation) {
        const reservationDate = new Date(reservation.date);
        const now = new Date();
        const hoursDiff = (reservationDate - now) / (1000 * 60 * 60);
        
        // 24時間前までキャンセル可能
        return hoursDiff > 24;
    }

    cancelReservation(reservationId) {
        if (!confirm('本当に予約をキャンセルしますか？\nキャンセル後の復旧はできません。')) {
            return;
        }

        if (this.isProduction) {
            this.cancelReservationAPI(reservationId);
        } else {
            // 開発環境での処理
            const reservations = this.getReservations();
            const reservationIndex = reservations.findIndex(r => r.id === reservationId);
            
            if (reservationIndex !== -1) {
                reservations[reservationIndex].status = 'cancelled';
                reservations[reservationIndex].cancelledAt = new Date().toISOString();
                
                localStorage.setItem(this.storageKey, JSON.stringify(reservations));
                
                // 表示を更新
                this.searchReservations();
                alert('予約がキャンセルされました。');
            }
        }
    }

    async cancelReservationAPI(reservationId) {
        try {
            const response = await this.sendToFunctionAPI('DELETE', `/api/reservations/${reservationId}`);
            
            if (response.status === 'success') {
                // 表示を更新
                this.searchReservations();
                alert('予約がキャンセルされました。');
            } else {
                throw new Error(response.message || 'Failed to cancel reservation');
            }
        } catch (error) {
            console.error('Error cancelling reservation:', error);
            alert('予約キャンセル中にエラーが発生しました: ' + (error.message || 'もう一度お試しください。'));
        }
    }

    rescheduleReservation(reservationId) {
        alert('予約変更機能は現在開発中です。\nお手数ですが、お電話でお問い合わせください。\nTEL: 03-1234-5678');
    }

    getReservations() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    }

    formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // 管理者機能（開発・テスト用）
    getAllReservations() {
        return this.getReservations();
    }

    clearAllReservations() {
        if (confirm('すべての予約データを削除しますか？（この操作は取り消せません）')) {
            localStorage.removeItem(this.storageKey);
            alert('すべての予約データが削除されました。');
        }
    }

    exportReservations() {
        const reservations = this.getReservations();
        const csvContent = this.convertToCSV(reservations);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `yoga_reservations_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    convertToCSV(reservations) {
        const headers = ['予約ID', 'クラス', 'スケジュール', '日付', '名前', 'メール', '電話', '備考', 'ステータス', '予約日時'];
        const classNames = {
            'hatha': 'ハタヨガ',
            'power': 'パワーヨガ',
            'restorative': 'リストラティブヨガ'
        };

        const rows = reservations.map(r => [
            r.id,
            classNames[r.class] || r.class,
            r.schedule,
            r.date,
            r.name,
            r.email,
            r.phone,
            r.notes || '',
            r.status === 'confirmed' ? '予約確定' : 'キャンセル済み',
            this.formatDateTime(r.createdAt)
        ]);

        return [headers, ...rows].map(row => 
            row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    }

    // Service Worker の登録
    registerServiceWorker() {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    }

    // Azure Function App APIとの通信
    async sendToFunctionAPI(method, endpoint, data = null) {
        if (!this.isProduction) {
            // 開発環境ではローカルストレージを使用
            return this.handleLocalStorage(method, endpoint, data);
        }

        try {
            const config = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            };

            if (data && (method === 'POST' || method === 'PUT')) {
                config.body = JSON.stringify(data);
            }

            const response = await fetch(endpoint, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Function API Error:', error);
            
            // APIが利用できない場合はローカルストレージにフォールバック
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                console.warn('Function API unavailable, falling back to localStorage');
                return this.handleLocalStorage(method, endpoint, data);
            }
            
            throw error;
        }
    }

    handleLocalStorage(method, endpoint, data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (method === 'POST' && endpoint.includes('/reservations')) {
                    // 予約作成のシミュレート
                    const reservations = this.getReservations();
                    
                    // 重複チェック
                    const isDuplicate = reservations.some(r => 
                        r.email === data.email &&
                        r.date === data.date &&
                        r.class === data.class &&
                        r.status === 'confirmed'
                    );
                    
                    if (isDuplicate) {
                        resolve({
                            status: 'error',
                            message: 'Duplicate reservation found'
                        });
                        return;
                    }
                    
                    reservations.push(data);
                    localStorage.setItem(this.storageKey, JSON.stringify(reservations));
                    resolve({
                        status: 'success',
                        data: data
                    });
                } else if (method === 'GET' && endpoint.includes('/reservations')) {
                    // 予約検索のシミュレート
                    const reservations = this.getReservations();
                    let filtered = reservations;
                    
                    if (endpoint.includes('email=')) {
                        const email = decodeURIComponent(endpoint.split('email=')[1]);
                        filtered = reservations.filter(r => r.email.toLowerCase() === email.toLowerCase());
                    }
                    
                    resolve({
                        status: 'success',
                        data: filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
                    });
                } else if (method === 'DELETE' && endpoint.includes('/reservations/')) {
                    // 予約キャンセルのシミュレート
                    const reservationId = endpoint.split('/').pop();
                    const reservations = this.getReservations();
                    const index = reservations.findIndex(r => r.id === reservationId);
                    
                    if (index !== -1) {
                        const reservation = reservations[index];
                        
                        // キャンセル可能性チェック
                        const reservationDate = new Date(reservation.date);
                        const now = new Date();
                        const hoursDiff = (reservationDate - now) / (1000 * 60 * 60);
                        
                        if (hoursDiff <= 24) {
                            resolve({
                                status: 'error',
                                message: 'キャンセル期限を過ぎています（レッスン開始24時間前まで）'
                            });
                            return;
                        }
                        
                        reservations[index].status = 'cancelled';
                        reservations[index].cancelledAt = new Date().toISOString();
                        localStorage.setItem(this.storageKey, JSON.stringify(reservations));
                        
                        resolve({
                            status: 'success',
                            message: 'Reservation cancelled successfully'
                        });
                    } else {
                        resolve({
                            status: 'error',
                            message: 'Reservation not found'
                        });
                    }
                }
            }, 500);
        });
    }

    saveToLocalStorage(data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const reservations = this.getReservations();
                reservations.push(data);
                localStorage.setItem(this.storageKey, JSON.stringify(reservations));
                resolve({ success: true, id: data.id });
            }, 500);
        });
    }

    // パフォーマンス監視
    trackPerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = {
                        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                        domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
                        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
                        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime
                    };
                    
                    console.log('Performance Metrics:', perfData);
                    
                    // 本番環境では分析データを送信
                    if (this.isProduction) {
                        this.sendAnalytics('performance', perfData);
                    }
                }, 0);
            });
        }
    }

    sendAnalytics(event, data) {
        // Azure Application Insights などの分析ツールとの連携
        if (window.appInsights) {
            window.appInsights.trackEvent(event, data);
        }
    }
}

// 予約管理システムの初期化
let reservationManager;

document.addEventListener('DOMContentLoaded', function() {
    // アニメーションの初期化
    animateOnScroll();
    animateCounters();
    
    // 遅延読み込みの初期化
    lazyLoadImages();
    
    // パフォーマンス向上のためのプリロード
    preloadCriticalResources();
    
    // アクセシビリティの向上
    improveAccessibility();
    
    // 予約システムの初期化
    reservationManager = new ReservationManager();
    
    // パフォーマンス監視
    reservationManager.trackPerformance();
});

console.log('Serenity Yoga Studio - Website with Reservation System loaded successfully!');
