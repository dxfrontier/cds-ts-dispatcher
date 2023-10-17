type HelloRequest {
    greeterName : String;
    toName      : String;
}

type HelloResponse {
    greetingMessage : String;
}

type Roles : String enum {
    USER;
    ADMIN;
}
