create table app_users (
    id uuid primary key,
    email varchar(320) not null unique,
    display_name varchar(120) not null,
    password_hash varchar(255),
    created_at timestamp with time zone not null
);

create table oauth_identities (
    id uuid primary key,
    user_id uuid not null references app_users(id) on delete cascade,
    provider varchar(40) not null,
    provider_subject varchar(255) not null,
    unique (provider, provider_subject)
);

create table problems (
    slug varchar(160) primary key,
    title varchar(180) not null,
    difficulty varchar(20) not null,
    category varchar(100) not null,
    description text not null
);

create table interview_sessions (
    id uuid primary key,
    user_id uuid references app_users(id) on delete set null,
    status varchar(30) not null,
    custom_session boolean not null,
    discussion_seconds integer not null,
    coding_seconds integer not null,
    created_at timestamp with time zone not null,
    submitted_at timestamp with time zone
);

create table interview_session_categories (
    session_id uuid not null references interview_sessions(id) on delete cascade,
    category varchar(100) not null
);

create table interview_questions (
    id uuid primary key,
    session_id uuid not null references interview_sessions(id) on delete cascade,
    problem_slug varchar(160) not null references problems(slug),
    question_order integer not null,
    language varchar(30),
    source_code text,
    ended_by varchar(30),
    unique (session_id, question_order),
    unique (session_id, problem_slug)
);

create table chat_messages (
    id uuid primary key,
    question_id uuid not null references interview_questions(id) on delete cascade,
    role varchar(30) not null,
    content text not null,
    created_at timestamp with time zone not null
);

create table submissions (
    id uuid primary key,
    session_id uuid not null unique references interview_sessions(id) on delete cascade,
    user_id uuid references app_users(id) on delete set null,
    interview_date timestamp with time zone not null,
    created_at timestamp with time zone not null
);

create table feedback (
    id uuid primary key,
    submission_id uuid not null unique references submissions(id) on delete cascade,
    status varchar(30) not null,
    overall_summary text not null,
    created_at timestamp with time zone not null
);

create table question_feedback (
    id uuid primary key,
    feedback_id uuid not null references feedback(id) on delete cascade,
    problem_slug varchar(160) not null,
    title varchar(180) not null,
    summary text not null,
    communication_score integer not null,
    approach_score integer not null,
    code_quality_score integer not null,
    question_order integer not null,
    unique (feedback_id, question_order)
);

create table question_feedback_recommendations (
    question_feedback_id uuid not null references question_feedback(id) on delete cascade,
    recommendation_order integer not null,
    recommendation text not null,
    primary key (question_feedback_id, recommendation_order)
);

create index idx_problems_category on problems(category);
create index idx_sessions_user on interview_sessions(user_id);
create index idx_messages_question_created on chat_messages(question_id, created_at);
create index idx_submissions_user_date on submissions(user_id, interview_date desc);
