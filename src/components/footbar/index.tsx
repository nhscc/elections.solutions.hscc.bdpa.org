import * as React from 'react'

export default function Footbar() {
    return (
        <footer>
            &copy; 2019 BDPA Elections, Inc.
            <style jsx>{`
                footer {
                    text-align: center;
                    background-color: black;
                    color: white;
                }
            `}</style>
        </footer>
    );
}
