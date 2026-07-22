FactoryBot.define do
  factory :habit_entry do
    association :account
    association :user
    date { Date.new(2026, 4, 1) }
    emoji { "🧘" }
  end
end
