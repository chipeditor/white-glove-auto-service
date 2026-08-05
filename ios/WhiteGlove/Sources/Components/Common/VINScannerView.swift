import SwiftUI
import AVFoundation

struct VINScannerView: UIViewControllerRepresentable {
    @Binding var scannedVIN: String
    @Environment(\.dismiss) var dismiss

    func makeUIViewController(context: Context) -> VINScannerViewController {
        let vc = VINScannerViewController()
        vc.delegate = context.coordinator
        return vc
    }

    func updateUIViewController(_ uiViewController: VINScannerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, VINScannerDelegate {
        let parent: VINScannerView

        init(_ parent: VINScannerView) {
            self.parent = parent
        }

        func didScanVIN(_ vin: String) {
            parent.scannedVIN = vin
            parent.dismiss()
        }

        func didCancel() {
            parent.dismiss()
        }
    }
}

protocol VINScannerDelegate: AnyObject {
    func didScanVIN(_ vin: String)
    func didCancel()
}

class VINScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    weak var delegate: VINScannerDelegate?
    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var hasScanned = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        setupCamera()
        setupOverlay()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.bounds
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        if let session = captureSession, !session.isRunning {
            DispatchQueue.global(qos: .userInitiated).async {
                session.startRunning()
            }
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        captureSession?.stopRunning()
    }

    private func setupCamera() {
        let session = AVCaptureSession()
        session.sessionPreset = .high

        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let input = try? AVCaptureDeviceInput(device: device) else {
            showError("Camera not available")
            return
        }

        if session.canAddInput(input) {
            session.addInput(input)
        }

        let output = AVCaptureMetadataOutput()
        if session.canAddOutput(output) {
            session.addOutput(output)
            output.setMetadataObjectsDelegate(self, queue: .main)
            output.metadataObjectTypes = [.code39, .code128, .dataMatrix, .pdf417, .qr]
        }

        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.videoGravity = .resizeAspectFill
        preview.frame = view.bounds
        view.layer.addSublayer(preview)

        captureSession = session
        previewLayer = preview

        DispatchQueue.global(qos: .userInitiated).async {
            session.startRunning()
        }
    }

    private func setupOverlay() {
        let cancelButton = UIButton(type: .system)
        cancelButton.setTitle("Cancel", for: .normal)
        cancelButton.setTitleColor(.white, for: .normal)
        cancelButton.titleLabel?.font = .systemFont(ofSize: 17, weight: .medium)
        cancelButton.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        cancelButton.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(cancelButton)

        let instructionLabel = UILabel()
        instructionLabel.text = "Point camera at VIN barcode"
        instructionLabel.textColor = .white
        instructionLabel.font = .systemFont(ofSize: 15, weight: .medium)
        instructionLabel.textAlignment = .center
        instructionLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(instructionLabel)

        let guideView = UIView()
        guideView.layer.borderColor = UIColor(red: 200/255, green: 164/255, blue: 92/255, alpha: 1).cgColor
        guideView.layer.borderWidth = 2
        guideView.layer.cornerRadius = 8
        guideView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(guideView)

        NSLayoutConstraint.activate([
            cancelButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            cancelButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),

            guideView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            guideView.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -40),
            guideView.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.85),
            guideView.heightAnchor.constraint(equalToConstant: 100),

            instructionLabel.topAnchor.constraint(equalTo: guideView.bottomAnchor, constant: 24),
            instructionLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
        ])
    }

    @objc private func cancelTapped() {
        delegate?.didCancel()
    }

    private func showError(_ message: String) {
        let label = UILabel()
        label.text = message
        label.textColor = .white
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
    }

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard !hasScanned else { return }

        for object in metadataObjects {
            guard let readable = object as? AVMetadataMachineReadableCodeObject,
                  let value = readable.stringValue else { continue }

            let cleaned = value.uppercased().trimmingCharacters(in: .whitespacesAndNewlines)
            if cleaned.count == 17, cleaned.allSatisfy({ $0.isLetter || $0.isNumber }) {
                hasScanned = true
                AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))
                captureSession?.stopRunning()
                delegate?.didScanVIN(cleaned)
                return
            }
        }
    }
}
