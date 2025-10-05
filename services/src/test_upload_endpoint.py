"""
Script para probar el endpoint de subida de imágenes con un archivo simple.
"""

import requests
import io
from PIL import Image


def create_test_image():
    """Crear una imagen de prueba en memoria."""
    # Crear una imagen simple de 100x100 píxeles
    img = Image.new("RGB", (100, 100), color="red")

    # Guardar en BytesIO
    img_bytes = io.BytesIO()
    img.save(img_bytes, format="JPEG", quality=85)
    img_bytes.seek(0)

    return img_bytes


def test_upload_endpoint():
    """Probar el endpoint de subida de imágenes."""
    # URL del endpoint (ajusta la IP y puerto según tu configuración)
    url = "http://127.0.0.1:8000/api/images/upload-profile"

    # Token de autorización - reemplaza con un token válido
    # Puedes obtenerlo desde el login de tu app o desde AsyncStorage
    token = "Bearer tu_token_aqui"  # REEMPLAZAR CON TOKEN REAL

    headers = {"Authorization": token}

    # Crear imagen de prueba
    test_image = create_test_image()

    # Preparar archivo para upload
    files = {"file": ("test_profile.jpg", test_image, "image/jpeg")}

    try:
        print("📤 Enviando imagen de prueba al backend...")
        print(f"🌐 URL: {url}")
        print(
            f"🔑 Auth: {token[:20]}..."
            if token != "Bearer tu_token_aqui"
            else "❌ TOKEN NO CONFIGURADO"
        )

        response = requests.post(url, files=files, headers=headers)

        print(f"📡 Status: {response.status_code}")
        print(f"📄 Response: {response.text}")

        if response.status_code == 200:
            result = response.json()
            print("✅ Upload exitoso!")
            print(f"🔑 S3 Key: {result.get('s3_key')}")
            print(f"🔗 Public URL: {result.get('public_url')}")
        else:
            print("❌ Upload falló")

    except Exception as e:
        print(f"❌ Error en la prueba: {e}")


if __name__ == "__main__":
    print("🧪 Probando endpoint de upload de imágenes...")
    print("\n⚠️  IMPORTANTE: Actualiza el token en la línea 25 con un token válido")
    print("   Puedes obtenerlo haciendo login en tu app y revisando AsyncStorage")
    print()

    test_upload_endpoint()
