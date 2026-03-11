export default function ConfirmDialog({ contact, onConfirm, onClose }) {
  return (
    <div className="overlay overlay--center" onClick={onClose}>
      <div className="modal modal--dialog" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Удалить контакт?</h2>
        <p className="modal-text">
          Запись «{contact.name}» будет удалена. Это действие необратимо.
        </p>
        <div className="form-actions">
          <button className="btn btn--secondary" onClick={onClose}>Отмена</button>
          <button className="btn btn--danger"    onClick={onConfirm}>Удалить</button>
        </div>
      </div>
    </div>
  )
}
