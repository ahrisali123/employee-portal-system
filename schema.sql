--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: eps; Type: SCHEMA; Schema: -; Owner: eps
--

CREATE SCHEMA eps;


ALTER SCHEMA eps OWNER TO eps;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: eps; Owner: eps
--

CREATE FUNCTION eps.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION eps.set_updated_at() OWNER TO eps;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: announcement_attachments; Type: TABLE; Schema: eps; Owner: eps
--

CREATE TABLE eps.announcement_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    announcement_id uuid NOT NULL,
    key character varying(255) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_type character varying(255),
    file_size bigint,
    uploaded_at timestamp without time zone DEFAULT now()
);


ALTER TABLE eps.announcement_attachments OWNER TO eps;

--
-- Name: announcement_departments; Type: TABLE; Schema: eps; Owner: eps
--

CREATE TABLE eps.announcement_departments (
    announcement_id uuid NOT NULL,
    department_id uuid NOT NULL
);


ALTER TABLE eps.announcement_departments OWNER TO eps;

--
-- Name: announcement_reads; Type: TABLE; Schema: eps; Owner: eps
--

CREATE TABLE eps.announcement_reads (
    user_id uuid NOT NULL,
    announcement_id uuid NOT NULL,
    opened_at timestamp without time zone NOT NULL,
    confirmed_at timestamp without time zone
);


ALTER TABLE eps.announcement_reads OWNER TO eps;

--
-- Name: announcements; Type: TABLE; Schema: eps; Owner: eps
--

CREATE TABLE eps.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    category character varying(50) NOT NULL,
    priority character varying(20) NOT NULL,
    status character varying(20) NOT NULL,
    requires_acknowledge boolean DEFAULT false NOT NULL,
    published_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_announcement_priority CHECK (((priority)::text = ANY ((ARRAY['LOW'::character varying, 'NORMAL'::character varying, 'HIGH'::character varying, 'URGENT'::character varying])::text[]))),
    CONSTRAINT chk_announcement_status CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'PUBLISHED'::character varying])::text[])))
);


ALTER TABLE eps.announcements OWNER TO eps;

--
-- Name: attachments; Type: TABLE; Schema: eps; Owner: eps
--

CREATE TABLE eps.attachments (
    id uuid NOT NULL,
    file_name character varying(255) NOT NULL,
    file_size bigint,
    file_type character varying(255),
    key character varying(255) NOT NULL,
    uploaded_at timestamp(6) without time zone,
    ticket_id uuid NOT NULL
);


ALTER TABLE eps.attachments OWNER TO eps;

--
-- Name: departments; Type: TABLE; Schema: eps; Owner: eps
--

CREATE TABLE eps.departments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE eps.departments OWNER TO eps;

--
-- Name: employee_tickets; Type: TABLE; Schema: eps; Owner: eps
--

CREATE TABLE eps.employee_tickets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    description character varying(255),
    status character varying(255) DEFAULT 'PENDING'::character varying NOT NULL,
    start_date date,
    end_date date,
    amount integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    destination character varying(255),
    CONSTRAINT chk_employee_tickets_status CHECK (((status)::text = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text, 'WITHDRAWN'::text])))
);


ALTER TABLE eps.employee_tickets OWNER TO eps;

--
-- Name: refresh_tokens; Type: TABLE; Schema: eps; Owner: eps
--

CREATE TABLE eps.refresh_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE eps.refresh_tokens OWNER TO eps;

--
-- Name: ticket_activities; Type: TABLE; Schema: eps; Owner: eps
--

CREATE TABLE eps.ticket_activities (
    id uuid NOT NULL,
    action character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    note text,
    actor_id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    CONSTRAINT ticket_activities_action_check CHECK (((action)::text = ANY ((ARRAY['CREATED'::character varying, 'APPROVED'::character varying, 'REJECTED'::character varying, 'WITHDRAWN'::character varying, 'RESUBMITTED'::character varying])::text[])))
);


ALTER TABLE eps.ticket_activities OWNER TO eps;

--
-- Name: ticket_approvals; Type: TABLE; Schema: eps; Owner: eps
--

CREATE TABLE eps.ticket_approvals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    approver_id uuid NOT NULL,
    step_order integer NOT NULL,
    status character varying(255) DEFAULT 'PENDING'::character varying NOT NULL,
    note character varying(255),
    reviewed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT chk_ticket_approvals_status CHECK (((status)::text = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text])))
);


ALTER TABLE eps.ticket_approvals OWNER TO eps;

--
-- Name: ticket_attachments; Type: TABLE; Schema: eps; Owner: eps
--

CREATE TABLE eps.ticket_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ticket_id uuid NOT NULL,
    key character varying(255) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_type character varying(255),
    file_size bigint,
    uploaded_at timestamp without time zone DEFAULT now()
);


ALTER TABLE eps.ticket_attachments OWNER TO eps;

--
-- Name: user_roles; Type: TABLE; Schema: eps; Owner: eps
--

CREATE TABLE eps.user_roles (
    user_id uuid NOT NULL,
    role character varying(255) NOT NULL
);


ALTER TABLE eps.user_roles OWNER TO eps;

--
-- Name: users; Type: TABLE; Schema: eps; Owner: eps
--

CREATE TABLE eps.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    department_id uuid NOT NULL
);


ALTER TABLE eps.users OWNER TO eps;

--
-- Name: announcement_attachments announcement_attachments_pkey; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.announcement_attachments
    ADD CONSTRAINT announcement_attachments_pkey PRIMARY KEY (id);


--
-- Name: announcement_departments announcement_departments_pkey; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.announcement_departments
    ADD CONSTRAINT announcement_departments_pkey PRIMARY KEY (announcement_id, department_id);


--
-- Name: announcement_reads announcement_reads_pkey; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.announcement_reads
    ADD CONSTRAINT announcement_reads_pkey PRIMARY KEY (user_id, announcement_id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: employee_tickets employee_tickets_pkey; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.employee_tickets
    ADD CONSTRAINT employee_tickets_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: ticket_activities ticket_activities_pkey; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.ticket_activities
    ADD CONSTRAINT ticket_activities_pkey PRIMARY KEY (id);


--
-- Name: ticket_approvals ticket_approvals_pkey; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.ticket_approvals
    ADD CONSTRAINT ticket_approvals_pkey PRIMARY KEY (id);


--
-- Name: ticket_attachments ticket_attachments_pkey; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.ticket_attachments
    ADD CONSTRAINT ticket_attachments_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_announcement_departments_department_id; Type: INDEX; Schema: eps; Owner: eps
--

CREATE INDEX idx_announcement_departments_department_id ON eps.announcement_departments USING btree (department_id);


--
-- Name: idx_announcement_reads_user_id; Type: INDEX; Schema: eps; Owner: eps
--

CREATE INDEX idx_announcement_reads_user_id ON eps.announcement_reads USING btree (user_id);


--
-- Name: idx_announcements_author_id; Type: INDEX; Schema: eps; Owner: eps
--

CREATE INDEX idx_announcements_author_id ON eps.announcements USING btree (author_id);


--
-- Name: idx_announcements_category; Type: INDEX; Schema: eps; Owner: eps
--

CREATE INDEX idx_announcements_category ON eps.announcements USING btree (category);


--
-- Name: idx_announcements_priority; Type: INDEX; Schema: eps; Owner: eps
--

CREATE INDEX idx_announcements_priority ON eps.announcements USING btree (priority);


--
-- Name: idx_announcements_published_at; Type: INDEX; Schema: eps; Owner: eps
--

CREATE INDEX idx_announcements_published_at ON eps.announcements USING btree (published_at);


--
-- Name: idx_announcements_status; Type: INDEX; Schema: eps; Owner: eps
--

CREATE INDEX idx_announcements_status ON eps.announcements USING btree (status);


--
-- Name: idx_employee_tickets_created_at_desc; Type: INDEX; Schema: eps; Owner: eps
--

CREATE INDEX idx_employee_tickets_created_at_desc ON eps.employee_tickets USING btree (created_at DESC);


--
-- Name: idx_employee_tickets_status; Type: INDEX; Schema: eps; Owner: eps
--

CREATE INDEX idx_employee_tickets_status ON eps.employee_tickets USING btree (status);


--
-- Name: idx_employee_tickets_user_id; Type: INDEX; Schema: eps; Owner: eps
--

CREATE INDEX idx_employee_tickets_user_id ON eps.employee_tickets USING btree (user_id);


--
-- Name: idx_refresh_tokens_user_id; Type: INDEX; Schema: eps; Owner: eps
--

CREATE INDEX idx_refresh_tokens_user_id ON eps.refresh_tokens USING btree (user_id);


--
-- Name: idx_ticket_approvals_approver_id; Type: INDEX; Schema: eps; Owner: eps
--

CREATE INDEX idx_ticket_approvals_approver_id ON eps.ticket_approvals USING btree (approver_id);


--
-- Name: idx_ticket_approvals_ticket_id; Type: INDEX; Schema: eps; Owner: eps
--

CREATE INDEX idx_ticket_approvals_ticket_id ON eps.ticket_approvals USING btree (ticket_id);


--
-- Name: employee_tickets trg_employee_tickets_updated_at; Type: TRIGGER; Schema: eps; Owner: eps
--

CREATE TRIGGER trg_employee_tickets_updated_at BEFORE UPDATE ON eps.employee_tickets FOR EACH ROW EXECUTE FUNCTION eps.set_updated_at();


--
-- Name: ticket_approvals trg_ticket_approvals_updated_at; Type: TRIGGER; Schema: eps; Owner: eps
--

CREATE TRIGGER trg_ticket_approvals_updated_at BEFORE UPDATE ON eps.ticket_approvals FOR EACH ROW EXECUTE FUNCTION eps.set_updated_at();


--
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: eps; Owner: eps
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON eps.users FOR EACH ROW EXECUTE FUNCTION eps.set_updated_at();


--
-- Name: announcement_reads announcement_reads_announcement_id_fkey; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.announcement_reads
    ADD CONSTRAINT announcement_reads_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES eps.announcements(id) ON DELETE CASCADE;


--
-- Name: announcement_reads announcement_reads_user_id_fkey; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.announcement_reads
    ADD CONSTRAINT announcement_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES eps.users(id) ON DELETE CASCADE;


--
-- Name: ticket_activities fk3vqgd6lgj6xvwvv27w1qimjxf; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.ticket_activities
    ADD CONSTRAINT fk3vqgd6lgj6xvwvv27w1qimjxf FOREIGN KEY (ticket_id) REFERENCES eps.employee_tickets(id);


--
-- Name: announcement_attachments fk_announcement_attachments_announcement; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.announcement_attachments
    ADD CONSTRAINT fk_announcement_attachments_announcement FOREIGN KEY (announcement_id) REFERENCES eps.announcements(id) ON DELETE CASCADE;


--
-- Name: announcement_departments fk_announcement_departments_announcement; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.announcement_departments
    ADD CONSTRAINT fk_announcement_departments_announcement FOREIGN KEY (announcement_id) REFERENCES eps.announcements(id);


--
-- Name: announcement_departments fk_announcement_departments_department; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.announcement_departments
    ADD CONSTRAINT fk_announcement_departments_department FOREIGN KEY (department_id) REFERENCES eps.departments(id);


--
-- Name: announcements fk_announcements_author; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.announcements
    ADD CONSTRAINT fk_announcements_author FOREIGN KEY (author_id) REFERENCES eps.users(id);


--
-- Name: employee_tickets fk_employee_tickets_user; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.employee_tickets
    ADD CONSTRAINT fk_employee_tickets_user FOREIGN KEY (user_id) REFERENCES eps.users(id);


--
-- Name: refresh_tokens fk_refresh_tokens_user; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.refresh_tokens
    ADD CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES eps.users(id);


--
-- Name: ticket_approvals fk_ticket_approvals_approver; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.ticket_approvals
    ADD CONSTRAINT fk_ticket_approvals_approver FOREIGN KEY (approver_id) REFERENCES eps.users(id);


--
-- Name: ticket_approvals fk_ticket_approvals_ticket; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.ticket_approvals
    ADD CONSTRAINT fk_ticket_approvals_ticket FOREIGN KEY (ticket_id) REFERENCES eps.employee_tickets(id) ON DELETE CASCADE;


--
-- Name: ticket_attachments fk_ticket_attachments_ticket; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.ticket_attachments
    ADD CONSTRAINT fk_ticket_attachments_ticket FOREIGN KEY (ticket_id) REFERENCES eps.employee_tickets(id) ON DELETE CASCADE;


--
-- Name: user_roles fk_user_roles_user; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.user_roles
    ADD CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES eps.users(id) ON DELETE CASCADE;


--
-- Name: users fk_users_department; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.users
    ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES eps.departments(id);


--
-- Name: attachments fkh1ykgq46nd0ntwl28y5rvv1e2; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.attachments
    ADD CONSTRAINT fkh1ykgq46nd0ntwl28y5rvv1e2 FOREIGN KEY (ticket_id) REFERENCES eps.employee_tickets(id);


--
-- Name: ticket_activities fkj27xx9qw3b3sm84hh8pgr3ej; Type: FK CONSTRAINT; Schema: eps; Owner: eps
--

ALTER TABLE ONLY eps.ticket_activities
    ADD CONSTRAINT fkj27xx9qw3b3sm84hh8pgr3ej FOREIGN KEY (actor_id) REFERENCES eps.users(id);


--
-- PostgreSQL database dump complete
--

