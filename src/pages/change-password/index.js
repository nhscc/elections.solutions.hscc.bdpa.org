/* @flow */

import * as React from 'react'
import { useRouter } from 'next/router'
import PasswordForm from 'components/password-form'
import MainLayout from 'components/layout/main'

export default function ChangePasswordPage() {
    return (
        <MainLayout>
            <PasswordForm />
        </MainLayout>
    );
}
