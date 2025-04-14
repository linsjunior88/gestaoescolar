-- Script para atualizar o cálculo de média no banco de dados

-- Primeiro, corrigir todas as médias existentes usando a fórmula correta
UPDATE nota
SET media = 
    CASE 
        WHEN nota_mensal IS NOT NULL AND nota_bimestral IS NOT NULL THEN
            CASE 
                WHEN recuperacao IS NOT NULL AND recuperacao > 0 THEN
                    ROUND(((nota_mensal + nota_bimestral) / 2 + recuperacao) / 2, 1)
                ELSE
                    ROUND((nota_mensal + nota_bimestral) / 2, 1)
            END
        WHEN nota_mensal IS NOT NULL THEN
            CASE 
                WHEN recuperacao IS NOT NULL AND recuperacao > 0 THEN
                    ROUND((nota_mensal + recuperacao) / 2, 1)
                ELSE
                    nota_mensal
            END
        WHEN nota_bimestral IS NOT NULL THEN
            CASE 
                WHEN recuperacao IS NOT NULL AND recuperacao > 0 THEN
                    ROUND((nota_bimestral + recuperacao) / 2, 1)
                ELSE
                    nota_bimestral
            END
        ELSE
            0
    END;

-- Criar uma função que será usada para calcular a média corretamente
CREATE OR REPLACE FUNCTION calcular_media_correta() RETURNS TRIGGER AS $$
BEGIN
    -- Calcular média inicial (mensal e bimestral)
    IF NEW.nota_mensal IS NOT NULL AND NEW.nota_bimestral IS NOT NULL THEN
        NEW.media := ROUND((NEW.nota_mensal + NEW.nota_bimestral) / 2, 1);
    ELSIF NEW.nota_mensal IS NOT NULL THEN
        NEW.media := NEW.nota_mensal;
    ELSIF NEW.nota_bimestral IS NOT NULL THEN
        NEW.media := NEW.nota_bimestral;
    ELSE
        NEW.media := 0;
    END IF;
    
    -- Se tem recuperação, média final = (média + recuperação) / 2
    IF NEW.recuperacao IS NOT NULL AND NEW.recuperacao > 0 THEN
        NEW.media := ROUND((NEW.media + NEW.recuperacao) / 2, 1);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verificar se já existe um trigger para o cálculo de média e removê-lo se existir
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'calcular_media_trigger' 
        AND tgrelid = 'nota'::regclass
    ) THEN
        DROP TRIGGER IF EXISTS calcular_media_trigger ON nota;
    END IF;
END $$;

-- Criar o trigger para calcular a média automaticamente em inserções e atualizações
CREATE TRIGGER calcular_media_trigger
BEFORE INSERT OR UPDATE ON nota
FOR EACH ROW
EXECUTE FUNCTION calcular_media_correta();

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE 'Cálculo de média atualizado com sucesso!';
END $$; 