type HelloRequest {
    greeterName : String;
    toName      : String;
}

type HelloResponse {
    greetingMessage : String;
}

type Roles     : String enum {
    USER;
    ADMIN;
}

type BookTypes : String enum {
    BOOK_SIGNING;
    AUTHOR_TALK;
    BOOK_LUNCH
}
