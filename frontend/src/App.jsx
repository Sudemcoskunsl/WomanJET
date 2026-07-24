import React, { useState } from 'react';
import { Send, Car, Users, Navigation, Sparkles, CreditCard, X, CheckCircle } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: "Merhaba! WomanJET VIP Transfer'e hoş geldiniz. Size nasıl yardımcı olabilirim? (Örn: \"Antalya havalimanından Kemer'e 4 kişilik araç istiyorum\")"
    }
  ]);
  const [input, setInput] = useState('');
  const [recommendedCars, setRecommendedCars] = useState([]);
  const [loading, setLoading] = useState(false);

  // 💳 Ödeme Yöntemi State'leri
  const [paymentMethod, setPaymentMethod] = useState('whatsapp');
  const [selectedCarForPayment, setSelectedCarForPayment] = useState(null); // Ödenmek istenen araç
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false); // Ödeme başarı durumu
  const [isPaying, setIsPaying] = useState(false); // Ödeme yüklenme durumu

  // Kart Form State'leri
  const [cardForm, setCardForm] = useState({
    name: '',
    cardNumber: '',
    expiry: '',
    cvc: ''
  });

  // 👑 Özel VIP İstekleri State'i
  const [extras, setExtras] = useState({
    internet: false,
    babySeat: false,
    miniBar: false,
    massageSeat: false,
    ps5: false,
    appleTv: false,
    soundSystem: false,
  });

  const handleExtraChange = (key) => {
    setExtras(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        setMessages((prev) => [...prev, { sender: 'bot', text: data.bot_response }]);
        if (data.recommended_cars && data.recommended_cars.length > 0) {
          setRecommendedCars(data.recommended_cars);
        }
      } else {
        setMessages((prev) => [...prev, { sender: 'bot', text: 'Bir hata oluştu.' }]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Üzgünüm, sunucuyla bağlantı kurulurken bir hata oluştu. Lütfen backend sunucusunun çalıştığından emin olun.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppBooking = (carName) => {
    const selectedExtras = [];
    if (extras.internet) selectedExtras.push("İnternet (Wi-Fi)");
    if (extras.babySeat) selectedExtras.push("Bebek Koltuğu");
    if (extras.miniBar) selectedExtras.push("Mini Bar");
    if (extras.massageSeat) selectedExtras.push("Masaj Koltuğu");
    if (extras.ps5) selectedExtras.push("PlayStation 5");
    if (extras.appleTv) selectedExtras.push("Apple TV");
    if (extras.soundSystem) selectedExtras.push("Ses Sistemi");

    let text = `Merhaba WomanJET! *${carName}* aracınız için VIP transfer rezervasyonu yapmak istiyorum.`;
    if (selectedExtras.length > 0) {
      text += `\n\n*Özel VIP İsteklerim:*\n- ${selectedExtras.join('\n- ')}`;
    }

    const whatsappUrl = `https://wa.me/905000000000?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  // 💳 Online Ödeme İşlemini Başlatma
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setIsPaying(true);

    try {
      // Backend Stripe endpoint'ine istek atıyoruz
      const res = await fetch('http://127.0.0.1:8000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_name: selectedCarForPayment.name,
          amount_eur: selectedCarForPayment.price_eur
        })
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        // Simüle edilmiş ödeme başarılı
        setTimeout(() => {
          setIsPaying(false);
          setIsPaymentSuccess(true);
        }, 1500);
      } else {
        alert('Ödeme başlatılamadı: ' + (data.detail || 'Bilinmeyen hata'));
        setIsPaying(false);
      }
    } catch (err) {
      alert('Sunucu hatası: Ödeme alınamadı.');
      setIsPaying(false);
    }
  };

  const closeModal = () => {
    setSelectedCarForPayment(null);
    setIsPaymentSuccess(false);
    setCardForm({ name: '', cardNumber: '', expiry: '', cvc: '' });
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', padding: '20px' }}>
      {/* Başlık (Header) */}
      <header style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles /> WomanJET VIP Transfer
        </h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.9 }}>Akıllı VIP Transfer & Araç Öneri Asistanı</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Sol Taraf: Chatbot */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', height: '620px' }}>
          <h2 style={{ fontSize: '18px', marginTop: 0, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            💬 Transfer Asistanı
          </h2>
          
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  backgroundColor: msg.sender === 'user' ? '#4f46e5' : '#f1f5f9',
                  color: msg.sender === 'user' ? '#fff' : '#0f172a',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  maxWidth: '80%',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}
              >
                {msg.text}
              </div>
            ))}
            {loading && <div style={{ fontSize: '12px', color: '#64748b' }}>Asistan yanıt veriyor...</div>}
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Örn: Antalya'dan Belek'e 6 kişilik transfer..."
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            />
            <button
              type="submit"
              style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Send size={16} /> Gönder
            </button>
          </form>
        </div>

        {/* Sağ Taraf: Önerilen Araçlar */}
        <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: '620px', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '18px', marginTop: 0, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            🚘 Önerilen VIP Araçlar
          </h2>

          {/* 👑 Özel VIP İstekleri Kutusu */}
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#334155' }}>👑 Özel VIP İstekleri Ekle:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#475569' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={extras.internet} onChange={() => handleExtraChange('internet')} /> 📶 İnternet
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={extras.babySeat} onChange={() => handleExtraChange('babySeat')} /> 👶 Bebek Koltuğu
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={extras.miniBar} onChange={() => handleExtraChange('miniBar')} /> 🍹 Mini Bar
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={extras.massageSeat} onChange={() => handleExtraChange('massageSeat')} /> 💆‍♂️ Masaj Koltuğu
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={extras.ps5} onChange={() => handleExtraChange('ps5')} /> 🎮 PlayStation 5
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={extras.appleTv} onChange={() => handleExtraChange('appleTv')} /> 📺 Apple TV
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', gridColumn: 'span 2' }}>
                <input type="checkbox" checked={extras.soundSystem} onChange={() => handleExtraChange('soundSystem')} /> 🔊 Ses Sistemi
              </label>
            </div>
          </div>

          {recommendedCars.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '60px' }}>
              <Car size={48} style={{ marginBottom: '10px' }} />
              <p>Henüz bir arama yapmadınız veya uygun araç bulunamadı.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {recommendedCars.map((car) => (
                <div key={car.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '15px', backgroundColor: '#fafafa' }}>
                  <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '16px' }}>{car.name}</h3>
                  <div style={{ display: 'flex', gap: '15px', color: '#64748b', fontSize: '13px', marginBottom: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={14} /> Kapasite: {car.capacity} Kişi</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Navigation size={14} /> Fiyat: {car.price_eur} €</span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {car.features.map((feat, i) => (
                      <span key={i} style={{ backgroundColor: '#e0e7ff', color: '#3730a3', fontSize: '11px', padding: '3px 8px', borderRadius: '12px' }}>
                        {feat}
                      </span>
                    ))}
                  </div>

                  {/* 💳 Ödeme Yöntemi Seçimi */}
                  <div style={{ marginBottom: '10px', fontSize: '12px', color: '#475569', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input 
                        type="radio" 
                        name={`payment-${car.id}`} 
                        value="whatsapp" 
                        checked={paymentMethod === 'whatsapp'} 
                        onChange={() => setPaymentMethod('whatsapp')} 
                      /> 💬 Araçta / WhatsApp
                    </label>
                    <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input 
                        type="radio" 
                        name={`payment-${car.id}`} 
                        value="online" 
                        checked={paymentMethod === 'online'} 
                        onChange={() => setPaymentMethod('online')} 
                      /> 💳 Online Ödeme
                    </label>
                  </div>

                  {/* 🔘 Seçilen Ödeme Yöntemine Göre Değişen Buton */}
                  {paymentMethod === 'whatsapp' ? (
                    <button
                      onClick={() => handleWhatsAppBooking(car.name)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#25D366',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      💬 WhatsApp ile Rezerve Et
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedCarForPayment(car)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#4f46e5',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      💳 Kart ile Güvenli Öde ({car.price_eur} €)
                    </button>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 💳 KREDİ KARTI ÖDEME MODAL'I */}
      {selectedCarForPayment && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#fff', width: '100%', maxWidth: '420px',
            borderRadius: '16px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            position: 'relative'
          }}>
            <button
              onClick={closeModal}
              style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={20} />
            </button>

            {!isPaymentSuccess ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ backgroundColor: '#e0e7ff', padding: '10px', borderRadius: '10px', color: '#4f46e5' }}>
                    <CreditCard size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Güvenli Online Ödeme</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Stripe altyapısı ile 256-bit korumalı</p>
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>Araç:</span>
                    <strong style={{ color: '#1e293b' }}>{selectedCarForPayment.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Toplam Tutar:</span>
                    <strong style={{ color: '#4f46e5', fontSize: '15px' }}>{selectedCarForPayment.price_eur} €</strong>
                  </div>
                </div>

                <form onSubmit={handleProcessPayment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Kart Üzerindeki İsim</label>
                    <input
                      type="text"
                      required
                      placeholder="Ahmet Yılmaz"
                      value={cardForm.name}
                      onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>Kart Numarası</label>
                    <input
                      type="text"
                      required
                      maxLength="19"
                      placeholder="4543 0000 0000 0000"
                      value={cardForm.cardNumber}
                      onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>SKT (Ay/Yıl)</label>
                      <input
                        type="text"
                        required
                        placeholder="12/28"
                        maxLength="5"
                        value={cardForm.expiry}
                        onChange={(e) => setCardForm({ ...cardForm, expiry: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}>CVC / CVV</label>
                      <input
                        type="text"
                        required
                        maxLength="4"
                        placeholder="123"
                        value={cardForm.cvc}
                        onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPaying}
                    style={{
                      marginTop: '8px',
                      backgroundColor: isPaying ? '#94a3b8' : '#4f46e5',
                      color: '#fff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      cursor: isPaying ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {isPaying ? 'İşleniyor...' : `${selectedCarForPayment.price_eur} € Öde`}
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle size={56} color="#22c55e" style={{ marginBottom: '12px' }} />
                <h3 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '20px' }}>Ödeme Başarılı!</h3>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0' }}>
                  <strong>{selectedCarForPayment.name}</strong> transfer rezervasyonunuz ve ödemeniz onaylandı. Onay mesajı tarafınıza gönderilmiştir.
                </p>
                <button
                  onClick={closeModal}
                  style={{
                    backgroundColor: '#22c55e',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Tamam
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default App;