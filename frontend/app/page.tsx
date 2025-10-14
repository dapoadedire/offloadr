import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex items-center gap-1">
        <h2 className="text-xl font-mono">offloadr</h2>
        <Image src="/logo.png" alt="Offloadr Logo" width={25} height={25} />
      </div>
      <p className="mt-1 text-center text-sm font-mono text-gray-600">
        sell your stuff before you leave campus.
      </p>
    </div>
  );
}
