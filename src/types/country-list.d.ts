declare module "country-list" {
  export function getData(): { name: string; code: string }[];
  export function getName(code: string): string | undefined;
  export function getCode(name: string): string | undefined;
}
