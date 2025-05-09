-- Supabase schema for the AI Email Generator

-- Email history table
create table email_history (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  prompt text not null,
  email text not null,
  created_at timestamp with time zone default now()
);

-- Create index for faster user-specific lookups
create index email_history_user_id_idx on email_history(user_id);

-- Row level security policies
alter table email_history enable row level security;

-- Policy to ensure users can only see their own emails
create policy "Users can view their own emails" 
  on email_history for select 
  using (auth.uid() = user_id);

-- Policy to ensure users can only insert their own emails
create policy "Users can insert their own emails" 
  on email_history for insert 
  with check (auth.uid() = user_id);

-- Policy to ensure users can only delete their own emails
create policy "Users can delete their own emails" 
  on email_history for delete 
  using (auth.uid() = user_id); 