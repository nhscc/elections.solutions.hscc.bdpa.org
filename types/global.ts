// ? Access types shared between projects from `types/global` too
export * from './_shared';

/**
 * 
 */
export const UserTypes = {
    default: '', // ? This is set later (below)
    administrator: 'administrator',
    moderator: 'moderator',
    voter: 'voter',
    reporter: 'reporter',
};

UserTypes.default = UserTypes.voter;
