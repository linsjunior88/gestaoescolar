import psycopg2

def corrigir_medias():
    """Corrige as médias no banco de dados"""
    print("Iniciando correção de médias...")
    
    # Configuração da conexão com o banco de dados
    # Ajuste estes valores conforme seu ambiente
    conn = None
    try:
        # Tentar conectar com várias configurações de codificação
        for encoding in ['utf8', 'latin1', None]:
            try:
                if encoding:
                    conn = psycopg2.connect(
                        host="localhost",
                        database="gestaoescolar",
                        user="postgres",
                        password="postgres",
                        port="5432",
                        client_encoding=encoding
                    )
                else:
                    conn = psycopg2.connect(
                        host="localhost",
                        database="gestaoescolar",
                        user="postgres",
                        password="postgres",
                        port="5432"
                    )
                conn.autocommit = False
                print(f"Conexão estabelecida com codificação: {encoding if encoding else 'padrão'}")
                break
            except Exception as e:
                print(f"Falha na conexão com codificação {encoding}: {e}")
        
        if not conn:
            print("Não foi possível conectar ao banco de dados após várias tentativas.")
            return
        
        cursor = conn.cursor()
        
        # Buscar todas as notas
        cursor.execute("""
            SELECT id, nota_mensal, nota_bimestral, recuperacao, media
            FROM nota
        """)
        
        notas = cursor.fetchall()
        print(f"Total de notas encontradas: {len(notas)}")
        
        total_atualizadas = 0
        
        # Para cada nota, calcular a média correta usando a fórmula do frontend
        for nota in notas:
            id_nota, nota_mensal, nota_bimestral, recuperacao, media_atual = nota
            
            # Converter valores para float (garantindo que None seja tratado como 0)
            nota_mensal_float = 0 if nota_mensal is None else float(nota_mensal)
            nota_bimestral_float = 0 if nota_bimestral is None else float(nota_bimestral)
            recuperacao_float = 0 if recuperacao is None else float(recuperacao)
            media_atual_float = 0 if media_atual is None else float(media_atual)
            
            # Calcular a média conforme a fórmula correta
            media_correta = 0
            
            if nota_mensal_float > 0 or nota_bimestral_float > 0:
                if nota_mensal_float > 0 and nota_bimestral_float > 0:
                    # Se ambas as notas estão presentes, a média é a soma dividida por 2
                    media_correta = (nota_mensal_float + nota_bimestral_float) / 2
                elif nota_mensal_float > 0:
                    media_correta = nota_mensal_float
                else:
                    media_correta = nota_bimestral_float
                
                # Se a recuperação está presente, a média final é a média entre a média anterior e a recuperação
                if recuperacao_float > 0:
                    media_correta = (media_correta + recuperacao_float) / 2
                
                # Arredondar para uma casa decimal
                media_correta = round(media_correta, 1)
            
            # Se a média calculada for diferente da média atual, atualizar no banco
            if abs(media_atual_float - media_correta) > 0.01:
                print(f"Nota ID {id_nota}: Mensal={nota_mensal_float}, Bimestral={nota_bimestral_float}, Recup={recuperacao_float}")
                print(f"  Média antiga: {media_atual_float}, Média nova: {media_correta}")
                
                try:
                    cursor.execute("""
                        UPDATE nota
                        SET media = %s
                        WHERE id = %s
                    """, (media_correta, id_nota))
                    total_atualizadas += 1
                except Exception as e:
                    print(f"Erro ao atualizar nota ID {id_nota}: {e}")
        
        # Commit das alterações
        conn.commit()
        print(f"\nTotal de notas atualizadas: {total_atualizadas}")
        
    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Erro geral: {e}")
    finally:
        if conn:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    print("=== CORREÇÃO DE MÉDIAS NO BANCO DE DADOS ===")
    corrigir_medias()
    print("=== PROCESSO CONCLUÍDO ===")
    print("\nPróximos passos:")
    print("1. Reinicie a API para garantir que o novo cálculo seja aplicado")
    print("2. Teste o sistema para verificar se as médias são calculadas corretamente") 