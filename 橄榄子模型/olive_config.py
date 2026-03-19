"""
橄榄子模型配置 - 200MB版本
"""

class OliveConfig:
    # 模型参数（~200MB）
    VOCAB_SIZE = 32000
    DIM_MODEL = 512      # 保持512
    N_LAYER = 8          # 8层
    N_HEAD = 8
    MAX_SEQ_LEN = 512
    FF_DIM = 2048
    DROPOUT = 0.1
    
    # 训练参数
    BATCH_SIZE = 8
    LR = 1e-4
    EPOCHS = 10
    
    # 自我进化参数
    SELF_PLAY_ROUNDS = 100
    QUALITY_THRESHOLD = 0.7
    EVOLUTION_CYCLES = 5

# 计算参数量
def calc_params():
    vocab = OliveConfig.VOCAB_SIZE
    dim = OliveConfig.DIM_MODEL
    layers = OliveConfig.N_LAYER
    heads = OliveConfig.N_HEAD
    ff_dim = OliveConfig.FF_DIM
    
    # Embedding
    emb_params = vocab * dim * 2  # token + position
    
    # Each layer
    # Attention: 4 * dim * dim (Q,K,V,O)
    # FFN: dim * ff_dim * 2
    layer_params = layers * (4 * dim * dim + dim * ff_dim * 2 + 4 * dim)  # +4*dim for layer norms
    
    # Output head
    head_params = dim * vocab
    
    total = emb_params + layer_params + head_params
    
    print(f"模型参数: {total:,}")
    print(f"约 {total/1e6:.1f}M 参数")
    print(f"预估大小: ~{total * 4 / 1024 / 1024:.0f}MB (float32)")
    
    return total

if __name__ == "__main__":
    calc_params()
