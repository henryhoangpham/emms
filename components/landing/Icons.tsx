import Image from 'next/image';

export function LogoIcon() {
  return (
    <Image
      src="/landing/arches-logo.png"
      alt="Arches Global Logo"
      width={40}
      height={40}
      className="rounded-md"
      priority
    />
  );
}