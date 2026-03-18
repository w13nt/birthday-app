-- ── Contacts ──────────────────────────────────────────────
create table contacts (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  day        integer not null,
  month      integer not null,
  year       integer,
  no_year    boolean default false,
  note       text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table contacts enable row level security;

create policy "Users manage own contacts"
  on contacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── User settings ──────────────────────────────────────────
create table user_settings (
  user_id          uuid references auth.users(id) on delete cascade primary key,
  notif_days       integer[] default '{0}',
  notif_time       text default '09:00',
  theme            text default 'light',
  telegram_chat_id bigint,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table user_settings enable row level security;

create policy "Users manage own settings"
  on user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Sent notifications (дедупликация) ─────────────────────
create table sent_notifications (
  id         bigserial primary key,
  key        text not null unique,
  user_id    uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table sent_notifications enable row level security;

-- Только сервер (service role) пишет в эту таблицу
create policy "Service role only"
  on sent_notifications for all
  using (false);
