import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useUserType } from 'universe/frontend/hooks'
import MainLayout from 'components/layout/main'

export default function ElectionPage() {
    const router = useRouter();
    const { id: electionId } = router.query;
    const { isAdmin, isModerator } = useUserType();

    // ? 0 = view, 1 = edit, 2 = delete, 3 = assign voters, 4 = assign mods
    const [ showMode, setShowMode ] = useState(0);

    const onEditElection = (e: React.SyntheticEvent) => {
        e.preventDefault();
    };

    const onDeleteElection = (e: React.SyntheticEvent) => {
        e.preventDefault();
    };

    const onAssignVoters = (e: React.SyntheticEvent) => {
        e.preventDefault();
    };

    const onAssignModerators = (e: React.SyntheticEvent) => {
        e.preventDefault();
    };

    const navbarRender = () => (isAdmin || isModerator) && (
        <React.Fragment>
            { isAdmin &&
                <li className={showMode == 1 ? 'active' : undefined}>
                    <a href="#edit" onClick={onEditElection}>Edit election</a>
                </li>
            }
            { isAdmin &&
                <li className={showMode == 2 ? 'active' : undefined}>
                    <a href="#delete" onClick={onDeleteElection}>Delete election</a>
                </li>
            }
            { (isAdmin || isModerator) &&
                <li className={showMode == 3 ? 'active' : undefined}>
                    <a href="#assign-voters" onClick={onAssignVoters}>Assign voters</a>
                </li>
            }
            { isAdmin &&
                <li className={showMode == 4 ? 'active' : undefined}>
                    <a href="#assign-moderators" onClick={onAssignModerators}>Assign moderators</a>
                </li>
            }
        </React.Fragment>
    );

    return (
        <MainLayout navbarRender={navbarRender}>
            <h1>Viewing election {electionId}</h1>
        </MainLayout>
    );
}
