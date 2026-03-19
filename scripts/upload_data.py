#!/usr/bin/env python3
"""
数据上传工具
- 支持阿里云OSS
- 支持腾讯云COS
- 支持生成临时链接
"""

import os
import json
from datetime import datetime

def upload_to_oss(filepath, bucket_name, access_key, secret_key):
    """上传到阿里云OSS"""
    try:
        import oss2
        
        auth = oss2.Auth(access_key, secret_key)
        bucket = oss2.Bucket(auth, 'oss-cn-hangzhou.aliyuncs.com', bucket_name)
        
        filename = os.path.basename(filepath)
        bucket.put_object_from_file(filename, filepath)
        
        # 生成临时链接（7天有效）
        url = bucket.sign_url('GET', filename, 7*24*3600)
        return url
    except ImportError:
        print("请安装oss2: pip install oss2")
        return None
    except Exception as e:
        print(f"上传失败: {e}")
        return None

def upload_to_cos(filepath, bucket_name, secret_id, secret_key):
    """上传到腾讯云COS"""
    try:
        from qcloud_cos import CosConfig
        from qcloud_cos import CosS3Client
        
        config = CosConfig(Region='ap-shanghai', SecretId=secret_id, SecretKey=secret_key)
        client = CosS3Client(config)
        
        filename = os.path.basename(filepath)
        client.upload_file(Bucket=bucket_name, Key=filename, FilePath=filepath)
        
        # 生成临时链接
        url = client.get_presigned_url(Method='GET', Bucket=bucket_name, Key=filename, Expired=7*24*3600)
        return url
    except ImportError:
        print("请安装cos-python-sdk-v5: pip install cos-python-sdk-v5")
        return None
    except Exception as e:
        print(f"上传失败: {e}")
        return None

def create_download_info(output_file, urls):
    """创建下载信息文件"""
    info = {
        "create_time": datetime.now().isoformat(),
        "expire_time": (datetime.now() + datetime.timedelta(days=7)).isoformat(),
        "files": urls
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(info, f, ensure_ascii=False, indent=2)
    
    return info

if __name__ == "__main__":
    print("数据上传工具")
    print("支持平台: 阿里云OSS, 腾讯云COS")
    print()
    print("使用前请配置环境变量:")
    print("  OSS_ACCESS_KEY_ID")
    print("  OSS_ACCESS_KEY_SECRET")
    print("  OSS_BUCKET_NAME")
    print()
    print("或创建配置文件: upload_config.json")
