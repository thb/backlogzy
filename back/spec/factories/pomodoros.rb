FactoryBot.define do
  factory :pomodoro do
    association :account
    association :user
    date { Date.new(2026, 4, 1) }
    count { 1 }
  end
end
