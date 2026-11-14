import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/auth';
import { Container } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Reset password',
};

export default function ResetPasswordPage() {
  return (
    <Container>
      <ResetPasswordForm />
    </Container>
  );
}
