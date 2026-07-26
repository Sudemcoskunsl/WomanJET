from main import calculate_flight_and_recommend

def test_city_and_feature_filter():
    # Test 1: İstanbul, 2 kişi ve bebek koltuğu isteği
    response_text, recommended_cars = calculate_flight_and_recommend("İstanbul'da 2 kişilik bebek koltuklu araç istiyorum")
    
    # Şehrin doğru algılandığını kontrol et
    assert "istanbul" in response_text.lower()
    
    # Gelen araçların hem kapasiteye uuygun hem de bebek koltuğu içerdiğini doğrula
    for car in recommended_cars:
        assert car["capacity"] >= 2
        assert "Bebek Koltuğu" in car["features"]

def test_invalid_input():
    # Test 2: Anlamsız veya çok kısa girdi testi
    response_text, recommended_cars = calculate_flight_and_recommend("aa")
    
    # Uyarı mesajı döndüğünü kontrol et
    assert "Yanlış veya anlaşılmayan" in response_text