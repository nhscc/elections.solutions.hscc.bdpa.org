import * as React from 'react'
import MainLayout from 'components/layout/main'

export default function HelpPage() {
    return (
        <MainLayout>
            <div>
                <h2>Need Help?</h2>
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce gravida rutrum augue et scelerisque.
                    Cras nulla dui, tincidunt et magna eu, finibus tempus elit. Mauris quis gravida tortor, eget iaculis
                    arcu. Donec sem velit, condimentum volutpat pretium in, auctor a nunc. Praesent vitae tempus nibh, sit
                    amet tincidunt nulla. Mauris finibus tempor vulputate.
                </p>
            </div>
            <style jsx>{`
                h2 {
                    font-weight: bold;
                    margin-bottom: 10px;
                }
            `}</style>
        </MainLayout>
    );
}
