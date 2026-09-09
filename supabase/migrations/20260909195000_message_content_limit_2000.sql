-- Raise chat message content limit to 2000 characters.
alter table public.messages
  drop constraint if exists messages_content_check;

alter table public.messages
  add constraint messages_content_check
  check (char_length(content) between 1 and 2000);
