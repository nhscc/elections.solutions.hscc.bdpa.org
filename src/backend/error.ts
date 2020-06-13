export class AppError extends Error {}
export class GuruMeditationError extends AppError {}
export class FrontendHookError extends AppError {}
export class NotAuthorizedError extends AppError {}

export class NotFoundError<T=string> extends AppError {
    constructor(reference?: T) {
        super(reference ? `"${reference}" does not exist or was not found` : 'item or resource was not found');
    }
}

export class AlreadyExistsError<T=string> extends AppError {
    constructor(reference?: T) {
        super(reference ? `"${reference}" already exists` : 'item or resource already exists');
    }
}

export class ValidationError extends AppError {
    constructor(message: string)
    constructor(expected: string, actual: string)
    constructor(...args: string[]) {
        super(args.length == 2
            ? `validation error: expected ${args[0]}, saw \`${args[2]}\` instead`
            : args[0]
        );
    }
}
