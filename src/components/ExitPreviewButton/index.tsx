import styles from './styles.module.scss'

export default function ExitPreviewButton() {
  return (
    <a className={styles.exitPreviewButton} href="/api/exit-preview">
      Sair do modo Preview
    </a>
  )
}