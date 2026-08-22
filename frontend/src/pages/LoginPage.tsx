import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Eye, EyeOff, UploadCloud, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  login_id: z.string().min(1, 'Login ID or Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const signupSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  name: z.string().min(2, 'Your name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(8, 'Confirm your password'),
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type SignupForm = z.infer<typeof signupSchema>;

export function LoginPage() {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { login_id: '', password: '' }
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { company_name: '', name: '', email: '', phone: '', password: '', confirm_password: '' }
  });

  const onLoginSubmit = async (data: LoginForm) => {
    setServerError(null);
    setIsLoading(true);
    try {
      const res = await authService.login(data);
      login(res.access_token, res.user);
      navigate('/employees');
    } catch (err: any) {
      setServerError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSignupSubmit = async (data: SignupForm) => {
    setServerError(null);
    setIsLoading(true);
    try {
      await authService.signup({
        ...data,
        ...(logoFile ? { logo: logoFile } : {})
      });
      // Switch back to login view after successful signup
      setView('login');
      setServerError('Account created successfully! Please sign in.');
    } catch (err: any) {
      setServerError(err.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="text-4xl font-bold text-primary tracking-tight">
          Day<span className="text-foreground">flow</span>
        </div>
        <p className="text-muted-foreground mt-2">Modern HR Management</p>
      </div>

      <Card className="w-full max-w-[420px] shadow-lg border-border/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl">
            {view === 'login' ? 'Welcome back' : 'Create an account'}
          </CardTitle>
          <CardDescription>
            {view === 'login' 
              ? 'Enter your credentials to access your workspace' 
              : 'Register your company to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {serverError && (
            <div className={`p-3 mb-4 text-sm rounded-md flex items-start gap-2 ${serverError.includes('successfully') ? 'bg-[#27AE60]/10 text-[#27AE60]' : 'bg-[#EB5757]/10 text-[#EB5757]'}`}>
              {!serverError.includes('successfully') && <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
              <span>{serverError}</span>
            </div>
          )}

          {view === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login_id">Login ID or Email</Label>
                <Input 
                  id="login_id" 
                  placeholder="e.g. OIJODO26001 or admin@company.com" 
                  {...loginForm.register('login_id')} 
                />
                {loginForm.formState.errors.login_id && (
                  <p className="text-xs text-[#EB5757]">{loginForm.formState.errors.login_id.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    {...loginForm.register('password')} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-[#EB5757]">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              
              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground mt-4 pt-4 border-t">
                Don't have an account?{' '}
                <button type="button" onClick={() => { setView('signup'); setServerError(null); loginForm.reset(); }} className="text-primary hover:underline font-medium">
                  Sign up your company
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>Company Logo (Optional)</Label>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-secondary/50">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <UploadCloud className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoChange}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input id="company_name" {...signupForm.register('company_name')} />
                {signupForm.formState.errors.company_name && <p className="text-xs text-[#EB5757]">{signupForm.formState.errors.company_name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input id="name" {...signupForm.register('name')} />
                  {signupForm.formState.errors.name && <p className="text-xs text-[#EB5757]">{signupForm.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" type="tel" {...signupForm.register('phone')} />
                  {signupForm.formState.errors.phone && <p className="text-xs text-[#EB5757]">{signupForm.formState.errors.phone.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="su_email">Work Email</Label>
                <Input id="su_email" type="email" {...signupForm.register('email')} />
                {signupForm.formState.errors.email && <p className="text-xs text-[#EB5757]">{signupForm.formState.errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="su_password">Password</Label>
                <div className="relative">
                  <Input 
                    id="su_password" 
                    type={showPassword ? 'text' : 'password'} 
                    {...signupForm.register('password')} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {signupForm.formState.errors.password && <p className="text-xs text-[#EB5757]">{signupForm.formState.errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <div className="relative">
                  <Input 
                    id="confirm_password" 
                    type={showConfirm ? 'text' : 'password'} 
                    {...signupForm.register('confirm_password')} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {signupForm.formState.errors.confirm_password && <p className="text-xs text-[#EB5757]">{signupForm.formState.errors.confirm_password.message}</p>}
              </div>

              <Button type="submit" className="w-full mt-4" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Sign up'}
              </Button>

              <div className="text-center text-sm text-muted-foreground mt-4 pt-4 border-t">
                Already have an account?{' '}
                <button type="button" onClick={() => { setView('login'); setServerError(null); signupForm.reset(); }} className="text-primary hover:underline font-medium">
                  Sign in
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
      
      {/* Dev Bypass Buttons for ease of testing */}
      <div className="mt-8 flex gap-4 justify-center">
        <button
          type="button"
          onClick={() => {
            login('mock-admin-token', {
              id: 1,
              login_id: 'OIJODO26001',
              email: 'admin@dayflow.com',
              role: 'admin',
              is_active: true,
              created_at: new Date().toISOString(),
            });
            navigate('/dashboard');
          }}
          className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs hover:bg-secondary/80 border opacity-50 hover:opacity-100 transition-opacity"
        >
          Dev Login (Admin)
        </button>
        <button
          type="button"
          onClick={() => {
            login('mock-employee-token', {
              id: 2,
              login_id: 'OIJODO26002',
              email: 'employee@dayflow.com',
              role: 'employee',
              is_active: true,
              created_at: new Date().toISOString(),
            });
            navigate('/dashboard');
          }}
          className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded text-xs hover:bg-secondary/80 border opacity-50 hover:opacity-100 transition-opacity"
        >
          Dev Login (Employee)
        </button>
      </div>
    </div>
  );
}
