export { User };
export { UserWithPassword };
export { UserBasicInfo };

type UserBasicInfo = {
  id: number;
  name: string;
};
type User = UserBasicInfo & {
  email: string;
};
type UserWithPassword = User & {
  password: string;
};
