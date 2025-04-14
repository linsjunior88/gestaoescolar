import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

def get_db_connection():
    """Estabelece conexão com o banco de dados"""
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "gestaoescolar"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "postgres"),
            port=os.getenv("DB_PORT", "5432")
        )
        conn.autocommit = False
        return conn
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        return None

def recalcular_media(nota_mensal, nota_bimestral, recuperacao):
    """
    Recalcula a média usando a fórmula correta:
    - Média = (mensal + bimestral) / 2
    - Se tem recuperação, média final = (média + recuperação) / 2
    """
    try:
        # Tratar valores None ou 0
        nota_mensal = 0 if nota_mensal is None else float(nota_mensal)
        nota_bimestral = 0 if nota_bimestral is None else float(nota_bimestral)
        recuperacao = 0 if recuperacao is None else float(recuperacao)
        
        # Calcular média inicial entre mensal e bimestral
        if nota_mensal > 0 or nota_bimestral > 0:
            if nota_mensal > 0 and nota_bimestral > 0:
                # Se ambas as notas estão presentes, a média é a média aritmética
                media = (nota_mensal + nota_bimestral) / 2
            elif nota_mensal > 0:
                media = nota_mensal
            else:
                media = nota_bimestral
            
            # Se tem recuperação, a média final é a média entre a média anterior e a nota de recuperação
            if recuperacao > 0:
                media = (media + recuperacao) / 2
                
            return round(media, 1)
        
        return 0.0
    
    except Exception as e:
        print(f"Erro ao calcular média: {e}")
        return 0.0

def corrigir_medias():
    """Corrige todas as médias no banco de dados"""
    print("Iniciando correção das médias...")
    
    conn = get_db_connection()
    if not conn:
        print("Não foi possível conectar ao banco de dados.")
        return 0
    
    cursor = conn.cursor()
    
    try:
        # Passo 1: Buscar todas as notas
        cursor.execute("""
            SELECT id, nota_mensal, nota_bimestral, recuperacao, media
            FROM nota
        """)
        
        notas = cursor.fetchall()
        total_notas = len(notas)
        total_corrigidas = 0
        
        print(f"Total de notas encontradas: {total_notas}")
        
        # Passo 2: Para cada nota, calcular a média correta e atualizar se necessário
        for nota in notas:
            id_nota, nota_mensal, nota_bimestral, recuperacao, media_atual = nota
            
            # Calcular a média correta
            media_correta = recalcular_media(nota_mensal, nota_bimestral, recuperacao)
            
            # Tratar media_atual como 0 se for None
            media_atual_float = 0.0 if media_atual is None else float(media_atual)
            
            # Se a média calculada for diferente da média atual, atualizar
            if abs(media_atual_float - media_correta) > 0.01:  # Usar tolerância para evitar problemas de arredondamento
                print(f"Nota ID {id_nota}:")
                print(f"  Mensal: {nota_mensal}, Bimestral: {nota_bimestral}, Recuperação: {recuperacao}")
                print(f"  Média antiga: {media_atual}, Média nova: {media_correta}")
                
                # Atualizar a média no banco
                cursor.execute("""
                    UPDATE nota SET media = %s WHERE id = %s
                """, (media_correta, id_nota))
                
                total_corrigidas += 1
        
        # Passo 3: Commit das alterações
        conn.commit()
        
        print(f"\nTotal de notas corrigidas: {total_corrigidas} de {total_notas}")
        
        return total_corrigidas
    
    except Exception as e:
        conn.rollback()
        print(f"Erro ao corrigir médias: {e}")
        return 0
    
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print("=== CORREÇÃO DE MÉDIAS ===")
    try:
        total = corrigir_medias()
        print(f"\nTotal de registros corrigidos: {total}")
        print("\nPara garantir que novas notas utilizem a fórmula correta:")
        print("1. Certifique-se de que o arquivo simplified_api.py foi corrigido")
        print("2. Reinicie o servidor da API para aplicar as mudanças")
    except Exception as e:
        print(f"Erro geral: {e}")
    print("\n=== PROCESSO CONCLUÍDO ===") 