import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import stripe

app = FastAPI(title="WomanJET VIP Transfer API")

# CORS ayarları (React frontend bağlantısı için)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Stripe API Anahtarı (Test ortamı için örnek key)
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_51Mz...")

# Veri Modelleri
class ChatRequest(BaseModel):
    message: str

class PaymentRequest(BaseModel):
    car_name: str
    amount_eur: float

# Örnek Araç Veritabanı (Mock verisi ile senkronize edildi)
CARS_DATABASE = [
    {
        "id": 1,
        "name": "Mercedes-Benz Vito Premium",
        "capacity": 6,
        "price_eur": 80,
        "features": ["Free Wi-Fi", "Mini Bar", "Apple TV", "Bebek Koltuğu"]
    },
    {
        "id": 2,
        "name": "Mercedes-Benz Sprinter Ultra VIP",
        "capacity": 13,
        "price_eur": 330,
        "features": ["PlayStation 5", "Reclining Seats", "Free Wi-Fi", "Sound System"]
    },
    {
        "id": 3,
        "name": "Mercedes-Maybach S-Class VIP",
        "capacity": 3,
        "price_eur": 200,
        "features": ["Massage Seats", "Free Wi-Fi", "Bebek Koltuğu"]
    },
    {
        "id": 4,
        "name": "Mercedes-Benz Sprinter Ultra VIP",
        "capacity": 6,
        "price_eur": 130,
        "features": ["Massage Seats", "Sound System", "Free Wi-Fi", "Mini Bar"]
    },
    {
        "id": 5,
        "name": "Mercedes-Benz Vito Premium",
        "capacity": 8,
        "price_eur": 160,
        "features": ["Massage Seats", "Free Wi-Fi", "Apple TV"]
    },
    {
        "id": 6,
        "name": "Mercedes-Maybach S-Class VIP",
        "capacity": 2,
        "price_eur": 80,
        "features": ["PlayStation 5", "Free Wi-Fi"]
    }
]
def calculate_flight_and_recommend(message: str):
    """
    Kullanıcının mesajından kisi sayısını ve uçuş bilgilerini analiz ederek 
    uçuş süresi/iniş saati hesaplar ve araç önerir.
    """
    msg_lower = message.lower()
    
    # Kişi sayısı belirleme
    person_count = 4 # varsayılan
    for num in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]:
        if f"{num} kiş" in msg_lower or f"{num} kis" in msg_lower:
            person_count = num
            break

    # Ülke / Şehir ve Uçuş Süreleri Havuzu (Saat cinsinden)
    flight_durations = {
        "ingiltere": ("İngiltere", 4.25),
        "london": ("İngiltere (Londra)", 4.25),
        "stansted": ("İngiltere (London Stansted)", 4.25),
        "almanya": ("Almanya", 3.5),
        "frankfurt": ("Almanya (Frankfurt)", 3.5),
        "berlin": ("Almanya (Berlin)", 3.5),
        "rusya": ("Rusya", 4.5),
        "moskova": ("Rusya (Moskova)", 4.5),
        "fransa": ("Fransa", 4.0),
        "paris": ("Fransa (Paris)", 4.0),
        "hollanda": ("Hollanda", 3.75),
        "amsterdam": ("Hollanda (Amsterdam)", 3.75)
    }

    detected_location = None
    flight_time_hours = 4.0 # varsayılan uçuş süresi

    for key, (loc_name, duration) in flight_durations.items():
        if key in msg_lower:
            detected_location = loc_name
            flight_time_hours = duration
            break

    # Saat tespiti (Örn: 14:00 veya 14.00)
    import re
    time_match = re.search(r'(\d{1,2})[:.](\d{2})', message)
    
    bot_response = ""
    
    if detected_location and time_match:
        dep_hour = int(time_match.group(1))
        dep_min = int(time_match.group(2))
        
        # İniş saati hesaplama (Kalkış saati + Uçuş süresi)
        total_dep_minutes = dep_hour * 60 + dep_min
        flight_minutes = int(flight_time_hours * 60)
        landing_total_minutes = (total_dep_minutes + flight_minutes) % (24 * 60)
        
        land_hour = landing_total_minutes // 60
        land_min = landing_total_minutes % 60
        
        # Karşılama saati (+45 dk pasaport/bagaj)
        pickup_total_minutes = (landing_total_minutes + 45) % (24 * 60)
        pickup_hour = pickup_total_minutes // 60
        pickup_min = pickup_total_minutes % 60
        
        hours_str = int(flight_time_hours)
        mins_str = int((flight_time_hours - hours_str) * 60)
        dur_text = f"{hours_str} saat {mins_str} dakika" if mins_str > 0 else f"{hours_str} saat"

        bot_response = (
            f"Talebinizi aldım! {detected_location} - Antalya uçuşu yaklaşık {dur_text} sürmektedir. "
            f"Saat {dep_hour:02d}:{dep_min:02d} kalkışlı uçağınızın tahmini Antalya Havalimanı iniş saati {land_hour:02d}:{land_min:02d}'dir. "
            f"Bagaj ve pasaport işlemleri göz önüne alınarak VIP aracımız saat {pickup_hour:02d}:{pickup_min:02d} itibarıyla "
            f"gelen yolcu çıkışında hazır olacaktır.\n\n"
            f"{person_count} kişilik grubunuz için en uygun araçlarımızı aşağıda listeledim."
        )
    else:
        bot_response = f"Talebinizi aldım! Antalya Havalimanı transferiniz için {person_count} kişilik VIP araçlarımızı aşağıda listeledim."

    # Kişi sayısına göre araç filtreleme
    recommended = [car for car in CARS_DATABASE if car["capacity"] >= person_count]
    if not recommended:
        recommended = CARS_DATABASE

    return bot_response, recommended

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        response_text, recommended_cars = calculate_flight_and_recommend(request.message)
        return {
            "status": "success",
            "bot_response": response_text,
            "recommended_cars": recommended_cars
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/create-payment-intent")
async def create_payment_intent(request: PaymentRequest):
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(request.amount_eur * 100),
            currency="eur",
            metadata={"car_name": request.car_name}
        )
        return {"status": "success", "client_secret": intent.client_secret}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)