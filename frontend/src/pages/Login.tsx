import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { LoginCredentials } from '@/types';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      setAuth(response.user, response.accessToken, response.refreshToken);
      toast.success('Logged in successfully');
      
      // Redirect based on role
      switch (response.user.role) {
        case 'mentor':
          navigate('/dashboard/mentor');
          break;
        case 'mentee':
          navigate('/dashboard/mentee');
          break;
        case 'admin':
          navigate('/dashboard/admin');
          break;
        default:
          navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Capital Factory</h1>
          <h2 className="mt-2 text-xl text-gray-600">Office Hours Matching Tool</h2>
        </div>
        <Card>
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">Sign in to your account</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
            />
            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Forgot password?
              </Link>
            </div>
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-500 font-medium">
              Sign up
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};





