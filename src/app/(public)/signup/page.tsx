import type { Metadata } from 'next';
import { SignupForm } from '@/components/auth';
import { Container } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Sign Up',
};

export default function SignupPage() {
  return (
    <Container>
      <SignupForm />
    </Container>
  );
}
