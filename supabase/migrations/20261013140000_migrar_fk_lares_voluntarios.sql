-- 1. Garantir que a coluna voluntario_id é opcional
ALTER TABLE public.lares_temporarios ALTER COLUMN voluntario_id DROP NOT NULL;

-- 2. Migração dos dados e recriação da chave estrangeira
DO $$
DECLARE
    v_constraint_name text;
    v_is_already_migrated boolean;
BEGIN
    -- Verifica se a chave estrangeira atual já aponta para a nova PK 'id' de 'voluntarios'
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = tc.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'lares_temporarios'
          AND kcu.column_name = 'voluntario_id'
          AND ccu.table_name = 'voluntarios'
          AND ccu.column_name = 'id'
    ) INTO v_is_already_migrated;

    IF NOT v_is_already_migrated THEN
        
        -- Migrar os dados: trocar o 'usuario_id' antigo pelo 'id' novo do voluntário
        UPDATE public.lares_temporarios lt
        SET voluntario_id = v.id
        FROM public.voluntarios v
        WHERE lt.voluntario_id = v.usuario_id;
        
        -- Limpar referências órfãs para garantir que a nova restrição não falhe
        UPDATE public.lares_temporarios
        SET voluntario_id = NULL
        WHERE voluntario_id IS NOT NULL 
          AND voluntario_id NOT IN (SELECT id FROM public.voluntarios);

        -- Encontrar e remover a FK antiga independentemente do nome
        SELECT tc.constraint_name INTO v_constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'lares_temporarios' 
          AND kcu.column_name = 'voluntario_id';

        IF v_constraint_name IS NOT NULL THEN
            EXECUTE 'ALTER TABLE public.lares_temporarios DROP CONSTRAINT ' || quote_ident(v_constraint_name);
        END IF;

        -- 3. Criar a nova Foreign Key apontando para o novo 'id' com ON DELETE SET NULL
        ALTER TABLE public.lares_temporarios 
        ADD CONSTRAINT lares_temporarios_voluntario_id_fkey 
        FOREIGN KEY (voluntario_id) REFERENCES public.voluntarios(id) ON DELETE SET NULL;
        
    END IF;
END $$;