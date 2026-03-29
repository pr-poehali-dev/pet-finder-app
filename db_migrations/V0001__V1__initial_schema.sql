
CREATE TYPE t_p27869002_pet_finder_app.user_role AS ENUM ('user', 'shelter', 'admin');

CREATE TABLE t_p27869002_pet_finder_app.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    role t_p27869002_pet_finder_app.user_role NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,
    oauth_provider VARCHAR(50),
    oauth_id VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMPTZ,
    lang VARCHAR(10) NOT NULL DEFAULT 'ru',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON t_p27869002_pet_finder_app.users(email);
CREATE INDEX idx_users_role ON t_p27869002_pet_finder_app.users(role);

CREATE TABLE t_p27869002_pet_finder_app.sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p27869002_pet_finder_app.users(id),
    token VARCHAR(512) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_token ON t_p27869002_pet_finder_app.sessions(token);
CREATE INDEX idx_sessions_user_id ON t_p27869002_pet_finder_app.sessions(user_id);

CREATE TABLE t_p27869002_pet_finder_app.shelters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES t_p27869002_pet_finder_app.users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    lat NUMERIC(10,6),
    lng NUMERIC(10,6),
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shelters_city ON t_p27869002_pet_finder_app.shelters(city);
CREATE INDEX idx_shelters_user_id ON t_p27869002_pet_finder_app.shelters(user_id);

CREATE TYPE t_p27869002_pet_finder_app.post_type AS ENUM ('lost', 'found', 'adopt');
CREATE TYPE t_p27869002_pet_finder_app.animal_type AS ENUM ('dog', 'cat', 'rabbit', 'bird', 'other');
CREATE TYPE t_p27869002_pet_finder_app.animal_sex AS ENUM ('male', 'female', 'unknown');
CREATE TYPE t_p27869002_pet_finder_app.animal_size AS ENUM ('small', 'medium', 'large', 'xlarge');
CREATE TYPE t_p27869002_pet_finder_app.post_status AS ENUM ('active', 'adopted', 'found', 'closed', 'pending', 'rejected');

CREATE TABLE t_p27869002_pet_finder_app.animals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p27869002_pet_finder_app.users(id),
    shelter_id INTEGER REFERENCES t_p27869002_pet_finder_app.shelters(id),
    post_type t_p27869002_pet_finder_app.post_type NOT NULL DEFAULT 'adopt',
    status t_p27869002_pet_finder_app.post_status NOT NULL DEFAULT 'pending',
    name VARCHAR(100),
    animal_type t_p27869002_pet_finder_app.animal_type NOT NULL DEFAULT 'dog',
    breed VARCHAR(100),
    age_months INTEGER,
    sex t_p27869002_pet_finder_app.animal_sex NOT NULL DEFAULT 'unknown',
    size t_p27869002_pet_finder_app.animal_size,
    color VARCHAR(100),
    description TEXT,
    city VARCHAR(100),
    address TEXT,
    lat NUMERIC(10,6),
    lng NUMERIC(10,6),
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    is_vaccinated BOOLEAN,
    is_sterilized BOOLEAN,
    is_chipped BOOLEAN,
    has_passport BOOLEAN,
    photos JSONB NOT NULL DEFAULT '[]',
    view_count INTEGER NOT NULL DEFAULT 0,
    lang VARCHAR(10) NOT NULL DEFAULT 'ru',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_animals_user_id ON t_p27869002_pet_finder_app.animals(user_id);
CREATE INDEX idx_animals_shelter_id ON t_p27869002_pet_finder_app.animals(shelter_id);
CREATE INDEX idx_animals_post_type ON t_p27869002_pet_finder_app.animals(post_type);
CREATE INDEX idx_animals_status ON t_p27869002_pet_finder_app.animals(status);
CREATE INDEX idx_animals_animal_type ON t_p27869002_pet_finder_app.animals(animal_type);
CREATE INDEX idx_animals_city ON t_p27869002_pet_finder_app.animals(city);
CREATE INDEX idx_animals_created_at ON t_p27869002_pet_finder_app.animals(created_at DESC);

CREATE TABLE t_p27869002_pet_finder_app.favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p27869002_pet_finder_app.users(id),
    animal_id INTEGER NOT NULL REFERENCES t_p27869002_pet_finder_app.animals(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, animal_id)
);

CREATE INDEX idx_favorites_user_id ON t_p27869002_pet_finder_app.favorites(user_id);

CREATE TABLE t_p27869002_pet_finder_app.conversations (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER REFERENCES t_p27869002_pet_finder_app.animals(id),
    sender_id INTEGER NOT NULL REFERENCES t_p27869002_pet_finder_app.users(id),
    recipient_id INTEGER NOT NULL REFERENCES t_p27869002_pet_finder_app.users(id),
    last_message TEXT,
    last_message_at TIMESTAMPTZ,
    sender_unread INTEGER NOT NULL DEFAULT 0,
    recipient_unread INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(sender_id, recipient_id, animal_id)
);

CREATE INDEX idx_conversations_sender ON t_p27869002_pet_finder_app.conversations(sender_id);
CREATE INDEX idx_conversations_recipient ON t_p27869002_pet_finder_app.conversations(recipient_id);

CREATE TABLE t_p27869002_pet_finder_app.messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES t_p27869002_pet_finder_app.conversations(id),
    sender_id INTEGER NOT NULL REFERENCES t_p27869002_pet_finder_app.users(id),
    body TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON t_p27869002_pet_finder_app.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON t_p27869002_pet_finder_app.messages(sender_id);

CREATE TYPE t_p27869002_pet_finder_app.notification_type AS ENUM ('new_message', 'status_change', 'new_animal', 'admin');

CREATE TABLE t_p27869002_pet_finder_app.notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p27869002_pet_finder_app.users(id),
    type t_p27869002_pet_finder_app.notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON t_p27869002_pet_finder_app.notifications(user_id);
CREATE INDEX idx_notifications_unread ON t_p27869002_pet_finder_app.notifications(user_id, is_read);
