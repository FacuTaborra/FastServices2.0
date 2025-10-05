"""
Test básico de conectividad a MinIO - solo verificar si podemos conectar.
"""

import boto3
from botocore.exceptions import ClientError

# Credenciales del .env
S3_ENDPOINT = "https://s3.taborra.dev"
S3_ACCESS_KEY = "6NQZRQZ2HQRI8A1Z1ZXQ"
S3_SECRET_KEY = "1q7HacT4g6ncbUH++1XMO5J3c+D4Xj77Tmn40Oi4"
S3_BUCKET_NAME = "fastservices"
S3_REGION = "us-east-1"


def test_basic_connectivity():
    """Test básico de conectividad."""
    print("🔗 Test básico de conectividad MinIO...")

    try:
        # Crear cliente S3
        client = boto3.client(
            "s3",
            endpoint_url=S3_ENDPOINT,
            aws_access_key_id=S3_ACCESS_KEY,
            aws_secret_access_key=S3_SECRET_KEY,
            region_name=S3_REGION,
        )

        print("✅ Cliente S3 creado exitosamente")

        # Test 1: Listar buckets
        print("\n📋 Test 1: Listar buckets...")
        response = client.list_buckets()
        buckets = [bucket["Name"] for bucket in response["Buckets"]]
        print(f"✅ Buckets encontrados: {buckets}")

        # Test 2: Verificar bucket específico
        print(f"\n🪣 Test 2: Verificar bucket '{S3_BUCKET_NAME}'...")
        if S3_BUCKET_NAME in buckets:
            print(f"✅ Bucket '{S3_BUCKET_NAME}' existe")

            # Test 3: Listar objetos en el bucket
            print(f"\n📄 Test 3: Listar objetos en bucket...")
            try:
                objects = client.list_objects_v2(Bucket=S3_BUCKET_NAME, MaxKeys=5)
                count = objects.get("KeyCount", 0)
                print(f"✅ Objetos en bucket: {count}")

                if count > 0 and "Contents" in objects:
                    print("📄 Primeros objetos:")
                    for obj in objects["Contents"]:
                        print(f"   - {obj['Key']} ({obj['Size']} bytes)")

            except Exception as list_error:
                print(f"⚠️ Error listando objetos: {list_error}")
        else:
            print(f"❌ Bucket '{S3_BUCKET_NAME}' no existe")

        return True

    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        print(f"❌ Error de cliente S3: {e}")
        print(f"📋 Error code: {error_code}")
        return False

    except Exception as e:
        print(f"❌ Error general: {e}")
        return False


if __name__ == "__main__":
    success = test_basic_connectivity()

    if success:
        print("\n🎉 Conectividad básica exitosa!")
        print("\n📋 Para solucionar IncompleteBody, prueba:")
        print("1. Verificar que MinIO tenga suficiente espacio")
        print("2. Revisar logs del servidor MinIO")
        print("3. Verificar firewall/proxy entre cliente y servidor")
        print("4. Probar con una conexión de red diferente")
    else:
        print("\n❌ Fallo en conectividad básica")
        print("Soluciona primero la conexión antes de probar uploads")
