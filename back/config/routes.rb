Rails.application.routes.draw do
  mount Rswag::Ui::Engine => "/api-docs"
  mount Rswag::Api::Engine => "/api-docs"

  namespace :v1 do
    post "auth/signup", to: "auth#signup"
    post "auth/login", to: "auth#login"
    post "auth/refresh", to: "auth#refresh"
    delete "auth/logout", to: "auth#logout"
    get "auth/me", to: "auth#me"
    patch "auth/me", to: "auth#update"
    patch "auth/password", to: "auth#change_password"
    post "auth/password/forgot", to: "passwords#create"
    post "auth/password/reset", to: "passwords#update"
    post "auth/oauth/exchange", to: "auth#oauth_exchange"

    # Create a workspace for an authenticated user who has none yet (post-OAuth signup).
    post "onboarding", to: "onboarding#create"

    post "uploads", to: "uploads#create"

    resources :projects, except: %i[show] do
      post :reorder, on: :collection
    end
    resources :items, except: %i[show] do
      post :reorder, on: :collection
      post :archive, on: :collection
    end
    resources :habit_entries, only: %i[index] do
      post :toggle, on: :collection
    end
    resources :pomodoros, only: %i[index] do
      post :increment, on: :collection
      post :decrement, on: :collection
    end
    post "import", to: "imports#create"

    resources :notifications, only: %i[index] do
      patch :read, on: :member
      post :read_all, on: :collection
    end

    # Member management (admin) + public invitation acceptance.
    resources :members, only: %i[index update destroy]
    get "invitations/accept", to: "invitation_acceptances#show"
    post "invitations/accept", to: "invitation_acceptances#create"
    resources :invitations, only: %i[index create destroy] do
      post :resend, on: :member
    end
  end

  # OmniAuth: request phase (/auth/:provider) is handled by the middleware; these are
  # the callback + failure landing points.
  get "auth/:provider/callback", to: "omniauth_callbacks#callback"
  get "auth/failure", to: "omniauth_callbacks#failure"

  # Liveness probe for load balancers / uptime monitors.
  get "up" => "rails/health#show", as: :rails_health_check
end
