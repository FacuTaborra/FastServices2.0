"""
Script simple para probar la conexión a MinIO y subir un archivo de prueba.
"""

import os
import boto3
from botocore.exceptions import ClientError
from io import BytesIO
import settings

# Configuración - usando las credenciales reales del .env
S3_ENDPOINT = settings.S3_ENDPOINT
S3_ACCESS_KEY = settings.S3_ACCESS_KEY  # Credenciales reales
S3_SECRET_KEY = settings.S3_SECRET_KEY  # Credenciales reales
S3_BUCKET_NAME = settings.S3_BUCKET_NAME
S3_REGION = settings.S3_REGION


def test_minio_simple():
    """Probar conexión básica a MinIO."""
    print("🔗 Probando conexión a MinIO...")
    print(f"   Endpoint: {S3_ENDPOINT}")
    print(f"   Bucket: {S3_BUCKET_NAME}")

    try:
        # Crear cliente S3
        client = boto3.client(
            "s3",
            endpoint_url=S3_ENDPOINT,
            aws_access_key_id=S3_ACCESS_KEY,
            aws_secret_access_key=S3_SECRET_KEY,
            region_name=S3_REGION,
        )

        # Probar listar buckets
        print("\n📋 Listando buckets...")
        response = client.list_buckets()
        buckets = [bucket["Name"] for bucket in response["Buckets"]]
        print(f"   Buckets encontrados: {buckets}")

        # Verificar/crear bucket
        if S3_BUCKET_NAME not in buckets:
            print(f"\n🪣 Creando bucket '{S3_BUCKET_NAME}'...")
            client.create_bucket(Bucket=S3_BUCKET_NAME)
            print(f"✅ Bucket '{S3_BUCKET_NAME}' creado")
        else:
            print(f"✅ Bucket '{S3_BUCKET_NAME}' ya existe")

        # Probar subir archivo simple
        print("\n📤 Subiendo archivo de prueba...")
        test_content = b"Hola FastServices! Esta es una prueba de MinIO."
        test_key = "test/prueba.txt"
        print(f"📏 Tamaño del contenido: {len(test_content)} bytes")
        print(f"🔑 Key: {test_key}")

        # Intentar sin ContentLength (boto3 lo calculará automáticamente)
        try:
            client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=test_key,
                Body=test_content,
                ContentType="text/plain",
            )
        except Exception as upload_error:
            print(f"❌ Error específico en upload: {upload_error}")
            print("🔄 Intentando con BytesIO...")

            # Intentar con BytesIO como en el backend
            from io import BytesIO

            content_buffer = BytesIO(test_content)
            client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=test_key,
                Body=content_buffer,
                ContentType="text/plain",
            )

        print(f"✅ Archivo subido: {test_key}")

        # Probar descargar archivo
        print(f"\n📥 Descargando archivo de prueba...")
        obj = client.get_object(Bucket=S3_BUCKET_NAME, Key=test_key)
        downloaded_content = obj["Body"].read()

        if downloaded_content == test_content:
            print(f"✅ Archivo descargado correctamente")
        else:
            print(f"❌ El contenido descargado no coincide")

        # Limpiar archivo de prueba
        print(f"\n🧹 Eliminando archivo de prueba...")
        client.delete_object(Bucket=S3_BUCKET_NAME, Key=test_key)
        print(f"✅ Archivo eliminado")

        print(f"\n🎉 ¡Prueba completada exitosamente!")
        return True

    except ClientError as e:
        print(f"\n❌ Error de cliente S3: {e}")
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        if error_code == "InvalidAccessKeyId":
            print("💡 Verifica S3_ACCESS_KEY en el .env")
        elif error_code == "SignatureDoesNotMatch":
            print("💡 Verifica S3_SECRET_KEY en el .env")
        elif error_code == "NoSuchBucket":
            print("💡 El bucket no existe, se intentará crear")
        return False
    except Exception as e:
        print(f"\n❌ Error general: {e}")
        return False


if __name__ == "__main__":
    success = test_minio_simple()

    if not success:
        print("\n💡 Soluciones posibles:")
        print("1. Verificar que MinIO esté corriendo en https://s3.taborra.dev")
        print("2. Actualizar las credenciales en este script")
        print("3. Verificar conectividad de red")
        print("4. Revisar logs de MinIO para más detalles")
