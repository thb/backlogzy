# Idempotent seeds for local development.
# Login with admin@example.com / password on account slug "acme".
#
# NEVER in production: db:prepare seeds when it creates the database, and a
# super_admin with a known password must not exist on a live SaaS.
if Rails.env.production?
  puts "Seeds skipped (production)."
  return
end

account = Account.find_or_create_by!(slug: "acme") { |a| a.name = "Acme Corp" }

admin = User.find_or_initialize_by(email: "admin@example.com")
admin.update!(name: "Admin", password: "password", super_admin: true)

AccountMembership.find_or_create_by!(user: admin, account: account) do |m|
  m.role = "admin"
  m.active = true
end

if account.projects.count.zero?
  backlog = account.projects.create!(name: "Backlogzy", color: "red", position: 1)
  side = account.projects.create!(name: "Side project", color: "teal", position: 2)

  backlog.items.create!(
    [
      { kind: "separator", label: "Sprint 1", position: 1 },
      { kind: "task", description: "Design the board", status: "IN_PROD", position: 2,
        estimation: 2, time_spent: 1.5, completed_at: Time.current },
      { kind: "task", description: "Ship the planning view", status: "IN_DEV", position: 3,
        estimation: 3, planned_start: Date.current, planned_end: Date.current + 2 },
      { kind: "task", description: "Write onboarding emails", status: "TODO", position: 4 }
    ]
  )
  side.items.create!(kind: "task", description: "Explore an idea", status: "WAITING", position: 1)
end

puts "Seeded: #{Account.count} account(s), #{User.count} user(s), " \
     "#{Project.count} project(s), #{Item.count} item(s)."
