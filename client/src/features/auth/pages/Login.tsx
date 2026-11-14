import { useState } from "react";
import { Button, Input, LanguageSwitcher } from "@/shared/components/ui";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { useLogin } from '../hooks/useLogin';
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginSchemaType } from "../auth.schemas";
import { LoginPayload } from '../auth.types';
import InputAdornment from '@mui/material/InputAdornment';
import { EyeFilledIcon } from "../assets/EyeFilledIcon";
import { EyeSlashFilledIcon } from "../assets/EyeSlashFilledIcon";
const Login = () => 
{ 
  const [ passwordIsVisible, setPasswordIsVisible ] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm<LoginSchemaType>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });
  const { mutate, isPending } = useLogin();
  const { t } = useTranslation();
  const onSubmit = async(data: LoginPayload) => mutate(data);
  return <div className="flex items-center justify-center min-h-dvh p-4">
    <div className="w-full max-w-md p-6 sm:p-8 bg-white border border-gray-200 shadow-sm rounded-2xl">
      <LanguageSwitcher className="justify-end mb-2" />
      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="flex flex-col gap-6" 
        noValidate
      >

      <div className="px-3 py-2">
        <img 
          src="/logo.svg" 
          width={175} 
          className="m-auto" 
        />
      </div>
        
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => {
            return <Input 
              label={t("auth.email")}
              placeholder={"demo@gmail.com"}
              fieldState={fieldState}
              isRequired
              {...field}
            />
          }}
        />

        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => {
            return <Input 
              label={t("auth.password")}
              placeholder={"12345678"}
              fieldState={fieldState}
              isRequired
              type={passwordIsVisible ? "text" : "password"}
              autoComplete="current-password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <button
                        type="button"
                        aria-label={t("auth.togglePassword")}
                        className="cursor-pointer"
                        onClick={() => setPasswordIsVisible((prev) => !prev) }
                      >
                        {passwordIsVisible ? ( <EyeSlashFilledIcon />) : ( <EyeFilledIcon /> )}
                      </button>
                    </InputAdornment>
                  )
                }
              }}
              {...field}
            />
          }}
        />

        <Button isPending={isPending} fullWidth type='submit'>
          {t("auth.login")}
        </Button>

      </form>
    </div>
  </div>
};
export default Login;