import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        ページが見つかりませんでした
      </p>
      <Link to="/">
        <Button>ホームに戻る</Button>
      </Link>
    </div>
  )
}
