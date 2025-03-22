export type User = {
  id: string;
  name: string;
  phone: string;
  email: string;
  time: string;
  game: string;
};

export type SignupFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        telegram?: string[];
        phone?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export type Table = {
  userId: string;
  id: string;
  date: dayString;
  tableName: string;
  status: string;
  club: string;
};

export type dayString = string | string[] | undefined;

export type SignupFieldType = {
  name?: string;
  email?: string;
  telegram?: string;
  phone?: string;
  password?: string;
};
