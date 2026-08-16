-- Prompt 19 — atomic category reorder in one transaction

create or replace function reorder_categories(items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  entry jsonb;
begin
  if not is_admin() then
    raise exception 'not authorized';
  end if;

  for entry in select * from jsonb_array_elements(items)
  loop
    update categories
       set sort_order = (entry->>'sort_order')::integer,
           updated_at = now()
     where id = (entry->>'id')::uuid;

    if not found then
      raise exception 'category % not found', entry->>'id';
    end if;
  end loop;
end;
$$;

grant execute on function reorder_categories(jsonb) to authenticated;
