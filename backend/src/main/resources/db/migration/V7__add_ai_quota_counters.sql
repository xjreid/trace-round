create table ai_quota_buckets (
    bucket_key varchar(200) not null,
    window_start timestamp with time zone not null,
    used_units integer not null,
    primary key (bucket_key, window_start),
    check (used_units >= 0)
);

create index idx_ai_quota_buckets_window_start
    on ai_quota_buckets(window_start);

alter table interview_questions
    add column ai_message_count integer not null default 0;

update interview_questions question
set ai_message_count = (
    select count(*)
    from chat_messages message
    where message.question_id = question.id
      and message.role = 'user'
);

alter table interview_questions
    add constraint chk_interview_questions_ai_message_count
    check (ai_message_count >= 0);
