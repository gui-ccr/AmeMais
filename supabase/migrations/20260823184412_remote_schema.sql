drop extension if exists "pg_net";


  create table "public"."adotantes" (
    "usuario_id" uuid not null,
    "cpf" text,
    "telefone" text,
    "endereco" text
      );



  create table "public"."agradecimentos" (
    "id" uuid not null default gen_random_uuid(),
    "nome" text not null,
    "tipo" text,
    "depoimento" text,
    "mes_ano_referencia" text not null,
    "ativo_no_site" boolean default false,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."animais" (
    "id" uuid not null default gen_random_uuid(),
    "nome" text not null,
    "especie" text,
    "raca" text,
    "status_adocao" text default 'Disponível'::text,
    "lar_temporario_id" uuid,
    "adotante_id" uuid,
    "url_foto" text,
    "data_adocao" date,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."doacoes" (
    "id" uuid not null default gen_random_uuid(),
    "ponto_coleta_id" uuid,
    "categoria" text not null,
    "data_entrada" date default CURRENT_DATE
      );



  create table "public"."documentos_admin" (
    "id" uuid not null default gen_random_uuid(),
    "tipo" text not null,
    "descricao" text,
    "data_vencimento" date,
    "valor" numeric(10,2),
    "arquivo_url" text
      );



  create table "public"."lares_temporarios" (
    "id" uuid not null default gen_random_uuid(),
    "voluntario_id" uuid,
    "capacidade" integer not null,
    "aceita_gatos" boolean default false,
    "aceita_cachorros" boolean default false
      );



  create table "public"."pontos_coleta" (
    "id" uuid not null default gen_random_uuid(),
    "nome" text not null,
    "endereco" text not null
      );



  create table "public"."reservas_hotel" (
    "id" uuid not null default gen_random_uuid(),
    "nome_tutor" text not null,
    "telefone_tutor" text not null,
    "nome_animal" text not null,
    "data_entrada" date not null,
    "data_saida" date not null,
    "valor_total" numeric(10,2) not null,
    "status_pagamento" text default 'Pendente'::text
      );



  create table "public"."usuarios" (
    "id" uuid not null,
    "nome" text not null,
    "email" text not null,
    "cargo" text not null,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."voluntarios" (
    "usuario_id" uuid not null,
    "telefone" text,
    "tipo" text
      );


CREATE UNIQUE INDEX adotantes_cpf_key ON public.adotantes USING btree (cpf);

CREATE UNIQUE INDEX adotantes_pkey ON public.adotantes USING btree (usuario_id);

CREATE UNIQUE INDEX agradecimentos_pkey ON public.agradecimentos USING btree (id);

CREATE UNIQUE INDEX animais_pkey ON public.animais USING btree (id);

CREATE UNIQUE INDEX doacoes_pkey ON public.doacoes USING btree (id);

CREATE UNIQUE INDEX documentos_admin_pkey ON public.documentos_admin USING btree (id);

CREATE UNIQUE INDEX lares_temporarios_pkey ON public.lares_temporarios USING btree (id);

CREATE UNIQUE INDEX pontos_coleta_pkey ON public.pontos_coleta USING btree (id);

CREATE UNIQUE INDEX reservas_hotel_pkey ON public.reservas_hotel USING btree (id);

CREATE UNIQUE INDEX usuarios_email_key ON public.usuarios USING btree (email);

CREATE UNIQUE INDEX usuarios_pkey ON public.usuarios USING btree (id);

CREATE UNIQUE INDEX voluntarios_pkey ON public.voluntarios USING btree (usuario_id);

alter table "public"."adotantes" add constraint "adotantes_pkey" PRIMARY KEY using index "adotantes_pkey";

alter table "public"."agradecimentos" add constraint "agradecimentos_pkey" PRIMARY KEY using index "agradecimentos_pkey";

alter table "public"."animais" add constraint "animais_pkey" PRIMARY KEY using index "animais_pkey";

alter table "public"."doacoes" add constraint "doacoes_pkey" PRIMARY KEY using index "doacoes_pkey";

alter table "public"."documentos_admin" add constraint "documentos_admin_pkey" PRIMARY KEY using index "documentos_admin_pkey";

alter table "public"."lares_temporarios" add constraint "lares_temporarios_pkey" PRIMARY KEY using index "lares_temporarios_pkey";

alter table "public"."pontos_coleta" add constraint "pontos_coleta_pkey" PRIMARY KEY using index "pontos_coleta_pkey";

alter table "public"."reservas_hotel" add constraint "reservas_hotel_pkey" PRIMARY KEY using index "reservas_hotel_pkey";

alter table "public"."usuarios" add constraint "usuarios_pkey" PRIMARY KEY using index "usuarios_pkey";

alter table "public"."voluntarios" add constraint "voluntarios_pkey" PRIMARY KEY using index "voluntarios_pkey";

alter table "public"."adotantes" add constraint "adotantes_cpf_key" UNIQUE using index "adotantes_cpf_key";

alter table "public"."adotantes" add constraint "adotantes_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE not valid;

alter table "public"."adotantes" validate constraint "adotantes_usuario_id_fkey";

alter table "public"."agradecimentos" add constraint "agradecimentos_tipo_check" CHECK ((tipo = ANY (ARRAY['Empresa'::text, 'Veterinário'::text, 'Doador'::text, 'Voluntário'::text]))) not valid;

alter table "public"."agradecimentos" validate constraint "agradecimentos_tipo_check";

alter table "public"."animais" add constraint "animais_adotante_id_fkey" FOREIGN KEY (adotante_id) REFERENCES public.adotantes(usuario_id) ON DELETE SET NULL not valid;

alter table "public"."animais" validate constraint "animais_adotante_id_fkey";

alter table "public"."animais" add constraint "animais_especie_check" CHECK ((especie = ANY (ARRAY['Gato'::text, 'Cachorro'::text]))) not valid;

alter table "public"."animais" validate constraint "animais_especie_check";

alter table "public"."animais" add constraint "animais_lar_temporario_id_fkey" FOREIGN KEY (lar_temporario_id) REFERENCES public.lares_temporarios(id) ON DELETE SET NULL not valid;

alter table "public"."animais" validate constraint "animais_lar_temporario_id_fkey";

alter table "public"."doacoes" add constraint "doacoes_ponto_coleta_id_fkey" FOREIGN KEY (ponto_coleta_id) REFERENCES public.pontos_coleta(id) ON DELETE CASCADE not valid;

alter table "public"."doacoes" validate constraint "doacoes_ponto_coleta_id_fkey";

alter table "public"."documentos_admin" add constraint "documentos_admin_tipo_check" CHECK ((tipo = ANY (ARRAY['Ata'::text, 'Nota Fiscal'::text, 'Relatório'::text]))) not valid;

alter table "public"."documentos_admin" validate constraint "documentos_admin_tipo_check";

alter table "public"."lares_temporarios" add constraint "lares_temporarios_voluntario_id_fkey" FOREIGN KEY (voluntario_id) REFERENCES public.voluntarios(usuario_id) ON DELETE CASCADE not valid;

alter table "public"."lares_temporarios" validate constraint "lares_temporarios_voluntario_id_fkey";

alter table "public"."usuarios" add constraint "usuarios_cargo_check" CHECK ((cargo = ANY (ARRAY['Admin'::text, 'Voluntário'::text, 'Adotante'::text]))) not valid;

alter table "public"."usuarios" validate constraint "usuarios_cargo_check";

alter table "public"."usuarios" add constraint "usuarios_email_key" UNIQUE using index "usuarios_email_key";

alter table "public"."usuarios" add constraint "usuarios_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."usuarios" validate constraint "usuarios_id_fkey";

alter table "public"."voluntarios" add constraint "voluntarios_tipo_check" CHECK ((tipo = ANY (ARRAY['Veterinário'::text, 'Apoio Geral'::text]))) not valid;

alter table "public"."voluntarios" validate constraint "voluntarios_tipo_check";

alter table "public"."voluntarios" add constraint "voluntarios_usuario_id_fkey" FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE not valid;

alter table "public"."voluntarios" validate constraint "voluntarios_usuario_id_fkey";

grant delete on table "public"."adotantes" to "anon";

grant insert on table "public"."adotantes" to "anon";

grant references on table "public"."adotantes" to "anon";

grant select on table "public"."adotantes" to "anon";

grant trigger on table "public"."adotantes" to "anon";

grant truncate on table "public"."adotantes" to "anon";

grant update on table "public"."adotantes" to "anon";

grant delete on table "public"."adotantes" to "authenticated";

grant insert on table "public"."adotantes" to "authenticated";

grant references on table "public"."adotantes" to "authenticated";

grant select on table "public"."adotantes" to "authenticated";

grant trigger on table "public"."adotantes" to "authenticated";

grant truncate on table "public"."adotantes" to "authenticated";

grant update on table "public"."adotantes" to "authenticated";

grant delete on table "public"."adotantes" to "service_role";

grant insert on table "public"."adotantes" to "service_role";

grant references on table "public"."adotantes" to "service_role";

grant select on table "public"."adotantes" to "service_role";

grant trigger on table "public"."adotantes" to "service_role";

grant truncate on table "public"."adotantes" to "service_role";

grant update on table "public"."adotantes" to "service_role";

grant delete on table "public"."agradecimentos" to "anon";

grant insert on table "public"."agradecimentos" to "anon";

grant references on table "public"."agradecimentos" to "anon";

grant select on table "public"."agradecimentos" to "anon";

grant trigger on table "public"."agradecimentos" to "anon";

grant truncate on table "public"."agradecimentos" to "anon";

grant update on table "public"."agradecimentos" to "anon";

grant delete on table "public"."agradecimentos" to "authenticated";

grant insert on table "public"."agradecimentos" to "authenticated";

grant references on table "public"."agradecimentos" to "authenticated";

grant select on table "public"."agradecimentos" to "authenticated";

grant trigger on table "public"."agradecimentos" to "authenticated";

grant truncate on table "public"."agradecimentos" to "authenticated";

grant update on table "public"."agradecimentos" to "authenticated";

grant delete on table "public"."agradecimentos" to "service_role";

grant insert on table "public"."agradecimentos" to "service_role";

grant references on table "public"."agradecimentos" to "service_role";

grant select on table "public"."agradecimentos" to "service_role";

grant trigger on table "public"."agradecimentos" to "service_role";

grant truncate on table "public"."agradecimentos" to "service_role";

grant update on table "public"."agradecimentos" to "service_role";

grant delete on table "public"."animais" to "anon";

grant insert on table "public"."animais" to "anon";

grant references on table "public"."animais" to "anon";

grant select on table "public"."animais" to "anon";

grant trigger on table "public"."animais" to "anon";

grant truncate on table "public"."animais" to "anon";

grant update on table "public"."animais" to "anon";

grant delete on table "public"."animais" to "authenticated";

grant insert on table "public"."animais" to "authenticated";

grant references on table "public"."animais" to "authenticated";

grant select on table "public"."animais" to "authenticated";

grant trigger on table "public"."animais" to "authenticated";

grant truncate on table "public"."animais" to "authenticated";

grant update on table "public"."animais" to "authenticated";

grant delete on table "public"."animais" to "service_role";

grant insert on table "public"."animais" to "service_role";

grant references on table "public"."animais" to "service_role";

grant select on table "public"."animais" to "service_role";

grant trigger on table "public"."animais" to "service_role";

grant truncate on table "public"."animais" to "service_role";

grant update on table "public"."animais" to "service_role";

grant delete on table "public"."doacoes" to "anon";

grant insert on table "public"."doacoes" to "anon";

grant references on table "public"."doacoes" to "anon";

grant select on table "public"."doacoes" to "anon";

grant trigger on table "public"."doacoes" to "anon";

grant truncate on table "public"."doacoes" to "anon";

grant update on table "public"."doacoes" to "anon";

grant delete on table "public"."doacoes" to "authenticated";

grant insert on table "public"."doacoes" to "authenticated";

grant references on table "public"."doacoes" to "authenticated";

grant select on table "public"."doacoes" to "authenticated";

grant trigger on table "public"."doacoes" to "authenticated";

grant truncate on table "public"."doacoes" to "authenticated";

grant update on table "public"."doacoes" to "authenticated";

grant delete on table "public"."doacoes" to "service_role";

grant insert on table "public"."doacoes" to "service_role";

grant references on table "public"."doacoes" to "service_role";

grant select on table "public"."doacoes" to "service_role";

grant trigger on table "public"."doacoes" to "service_role";

grant truncate on table "public"."doacoes" to "service_role";

grant update on table "public"."doacoes" to "service_role";

grant delete on table "public"."documentos_admin" to "anon";

grant insert on table "public"."documentos_admin" to "anon";

grant references on table "public"."documentos_admin" to "anon";

grant select on table "public"."documentos_admin" to "anon";

grant trigger on table "public"."documentos_admin" to "anon";

grant truncate on table "public"."documentos_admin" to "anon";

grant update on table "public"."documentos_admin" to "anon";

grant delete on table "public"."documentos_admin" to "authenticated";

grant insert on table "public"."documentos_admin" to "authenticated";

grant references on table "public"."documentos_admin" to "authenticated";

grant select on table "public"."documentos_admin" to "authenticated";

grant trigger on table "public"."documentos_admin" to "authenticated";

grant truncate on table "public"."documentos_admin" to "authenticated";

grant update on table "public"."documentos_admin" to "authenticated";

grant delete on table "public"."documentos_admin" to "service_role";

grant insert on table "public"."documentos_admin" to "service_role";

grant references on table "public"."documentos_admin" to "service_role";

grant select on table "public"."documentos_admin" to "service_role";

grant trigger on table "public"."documentos_admin" to "service_role";

grant truncate on table "public"."documentos_admin" to "service_role";

grant update on table "public"."documentos_admin" to "service_role";

grant delete on table "public"."lares_temporarios" to "anon";

grant insert on table "public"."lares_temporarios" to "anon";

grant references on table "public"."lares_temporarios" to "anon";

grant select on table "public"."lares_temporarios" to "anon";

grant trigger on table "public"."lares_temporarios" to "anon";

grant truncate on table "public"."lares_temporarios" to "anon";

grant update on table "public"."lares_temporarios" to "anon";

grant delete on table "public"."lares_temporarios" to "authenticated";

grant insert on table "public"."lares_temporarios" to "authenticated";

grant references on table "public"."lares_temporarios" to "authenticated";

grant select on table "public"."lares_temporarios" to "authenticated";

grant trigger on table "public"."lares_temporarios" to "authenticated";

grant truncate on table "public"."lares_temporarios" to "authenticated";

grant update on table "public"."lares_temporarios" to "authenticated";

grant delete on table "public"."lares_temporarios" to "service_role";

grant insert on table "public"."lares_temporarios" to "service_role";

grant references on table "public"."lares_temporarios" to "service_role";

grant select on table "public"."lares_temporarios" to "service_role";

grant trigger on table "public"."lares_temporarios" to "service_role";

grant truncate on table "public"."lares_temporarios" to "service_role";

grant update on table "public"."lares_temporarios" to "service_role";

grant delete on table "public"."pontos_coleta" to "anon";

grant insert on table "public"."pontos_coleta" to "anon";

grant references on table "public"."pontos_coleta" to "anon";

grant select on table "public"."pontos_coleta" to "anon";

grant trigger on table "public"."pontos_coleta" to "anon";

grant truncate on table "public"."pontos_coleta" to "anon";

grant update on table "public"."pontos_coleta" to "anon";

grant delete on table "public"."pontos_coleta" to "authenticated";

grant insert on table "public"."pontos_coleta" to "authenticated";

grant references on table "public"."pontos_coleta" to "authenticated";

grant select on table "public"."pontos_coleta" to "authenticated";

grant trigger on table "public"."pontos_coleta" to "authenticated";

grant truncate on table "public"."pontos_coleta" to "authenticated";

grant update on table "public"."pontos_coleta" to "authenticated";

grant delete on table "public"."pontos_coleta" to "service_role";

grant insert on table "public"."pontos_coleta" to "service_role";

grant references on table "public"."pontos_coleta" to "service_role";

grant select on table "public"."pontos_coleta" to "service_role";

grant trigger on table "public"."pontos_coleta" to "service_role";

grant truncate on table "public"."pontos_coleta" to "service_role";

grant update on table "public"."pontos_coleta" to "service_role";

grant delete on table "public"."reservas_hotel" to "anon";

grant insert on table "public"."reservas_hotel" to "anon";

grant references on table "public"."reservas_hotel" to "anon";

grant select on table "public"."reservas_hotel" to "anon";

grant trigger on table "public"."reservas_hotel" to "anon";

grant truncate on table "public"."reservas_hotel" to "anon";

grant update on table "public"."reservas_hotel" to "anon";

grant delete on table "public"."reservas_hotel" to "authenticated";

grant insert on table "public"."reservas_hotel" to "authenticated";

grant references on table "public"."reservas_hotel" to "authenticated";

grant select on table "public"."reservas_hotel" to "authenticated";

grant trigger on table "public"."reservas_hotel" to "authenticated";

grant truncate on table "public"."reservas_hotel" to "authenticated";

grant update on table "public"."reservas_hotel" to "authenticated";

grant delete on table "public"."reservas_hotel" to "service_role";

grant insert on table "public"."reservas_hotel" to "service_role";

grant references on table "public"."reservas_hotel" to "service_role";

grant select on table "public"."reservas_hotel" to "service_role";

grant trigger on table "public"."reservas_hotel" to "service_role";

grant truncate on table "public"."reservas_hotel" to "service_role";

grant update on table "public"."reservas_hotel" to "service_role";

grant delete on table "public"."usuarios" to "anon";

grant insert on table "public"."usuarios" to "anon";

grant references on table "public"."usuarios" to "anon";

grant select on table "public"."usuarios" to "anon";

grant trigger on table "public"."usuarios" to "anon";

grant truncate on table "public"."usuarios" to "anon";

grant update on table "public"."usuarios" to "anon";

grant delete on table "public"."usuarios" to "authenticated";

grant insert on table "public"."usuarios" to "authenticated";

grant references on table "public"."usuarios" to "authenticated";

grant select on table "public"."usuarios" to "authenticated";

grant trigger on table "public"."usuarios" to "authenticated";

grant truncate on table "public"."usuarios" to "authenticated";

grant update on table "public"."usuarios" to "authenticated";

grant delete on table "public"."usuarios" to "service_role";

grant insert on table "public"."usuarios" to "service_role";

grant references on table "public"."usuarios" to "service_role";

grant select on table "public"."usuarios" to "service_role";

grant trigger on table "public"."usuarios" to "service_role";

grant truncate on table "public"."usuarios" to "service_role";

grant update on table "public"."usuarios" to "service_role";

grant delete on table "public"."voluntarios" to "anon";

grant insert on table "public"."voluntarios" to "anon";

grant references on table "public"."voluntarios" to "anon";

grant select on table "public"."voluntarios" to "anon";

grant trigger on table "public"."voluntarios" to "anon";

grant truncate on table "public"."voluntarios" to "anon";

grant update on table "public"."voluntarios" to "anon";

grant delete on table "public"."voluntarios" to "authenticated";

grant insert on table "public"."voluntarios" to "authenticated";

grant references on table "public"."voluntarios" to "authenticated";

grant select on table "public"."voluntarios" to "authenticated";

grant trigger on table "public"."voluntarios" to "authenticated";

grant truncate on table "public"."voluntarios" to "authenticated";

grant update on table "public"."voluntarios" to "authenticated";

grant delete on table "public"."voluntarios" to "service_role";

grant insert on table "public"."voluntarios" to "service_role";

grant references on table "public"."voluntarios" to "service_role";

grant select on table "public"."voluntarios" to "service_role";

grant trigger on table "public"."voluntarios" to "service_role";

grant truncate on table "public"."voluntarios" to "service_role";

grant update on table "public"."voluntarios" to "service_role";


