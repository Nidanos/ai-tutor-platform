export type SignupErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  dateOfBirth?: string;
  acceptTerms?: string;
  acceptPrivacy?: string;
};

export type SignupFormData = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  aiTraining: boolean;
  research: boolean;
};

export type RegisterResponse = {
  user: {
    status: "active" | "pending_parent";
  };
};
