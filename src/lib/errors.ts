const MESSAGES: Record<string, string> = {
  slug_taken: 'That web address is already taken. Try another.',
  reserved_slug: 'That web address is reserved. Try another.',
  invalid_slug: 'Use 3-40 letters, numbers and single hyphens only.',
  invalid_name: 'Restaurant name must be at least 2 characters.',
  restaurant_limit_reached: 'You have reached the maximum number of restaurants.',
  not_authenticated: 'Please sign in again.',
  name_required: 'Please enter the English name.',
  invalid_price: 'Enter a valid price.',
  invalid_category: 'Please choose a valid category.',
  item_not_found: 'That item was not found. Refresh and try again.',
  category_not_found: 'That category was not found. Refresh and try again.',
  too_many_variants: 'You can add up to 10 sizes per item.',
  too_many_addons: 'You can add up to 20 add-ons per item.',
  invalid_input: 'Some values are not valid. Please check and try again.',
  forbidden: 'You do not have permission to do that.',
  already_member: 'That person is already on your team.',
  invalid_email: 'Enter a valid email address.',
  invalid_role: 'That role is not allowed.',
  member_not_found: 'That team member was not found.',
};

export function friendlyError(message: string | undefined): string {
  if (!message) return 'Something went wrong. Please try again.';
  if (message.includes('violates foreign key')) return 'This is still in use, so it cannot be removed. Move or delete the items inside first.';
  if (message.includes('violates check constraint')) return 'One of the values is too long or not allowed.';
  for (const key of Object.keys(MESSAGES)) {
    if (message.includes(key)) return MESSAGES[key];
  }
  return message;
}

export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
