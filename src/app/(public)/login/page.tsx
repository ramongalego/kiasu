import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth';
import { Container } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Log In',
};

export default function LoginPage() {
  return (
    <Container>
      <LoginForm />
    </Container>
  );
}
