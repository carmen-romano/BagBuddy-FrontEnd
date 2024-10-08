import React, { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar,
  Alert,
} from "@mui/material";
import { IoMdCart } from "react-icons/io";
import { GiStarsStack } from "react-icons/gi";
import Pagination from "@mui/material/Pagination";
import DashboardBox from "../Dashboard/components/DashboardBox";
import Sidebar from "../../components/Sidebar/Sidebar";
import Chart from "react-google-charts";
import Header from "../../components/Header/Header";
import { PaginationItem } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { Col } from "react-bootstrap";
import { FaPen } from "react-icons/fa";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import { jwtDecode } from "jwt-decode";

const options = {
  backgroundColor: "transparent",
  chartArea: { width: "100%", height: "100%" },
};

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [data, setData] = useState([["Year", "Sales"]]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const navigate = useNavigate();
  const token = localStorage.getItem("authToken");

  useEffect(() => {
    if (!token) {
      setSnackbarMessage("Non sei autenticato. Effettua il login.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      navigate("/login");
    } else {
      try {
        const decodedToken = jwtDecode(token);
        if (decodedToken.role !== "ADMIN") {
          setSnackbarMessage(
            "Non sei autorizzato ad accedere a questa pagina."
          );
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
          navigate("/login");
        }
      } catch (error) {
        console.error("Errore nella decodifica del token:", error);
        setSnackbarMessage("Token non valido. Effettua di nuovo il login.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        localStorage.removeItem("authToken");
        navigate("/login");
      }
    }
  }, [token, navigate]);

  const fetchOrders = useCallback(() => {
    fetch(`http://localhost:3001/orders?page=${currentPage - 1}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error fetching orders: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        setOrders(data.content || []);
        setTotalPages(data.totalPages);
      })
      .catch(error => {
        console.error("Error fetching orders:", error);
        setSnackbarMessage("Errore durante il recupero degli ordini.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      });
  }, [currentPage, token]);

  const fetchTotal = useCallback(() => {
    fetch("http://localhost:3001/orders", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error fetching orders: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        const orders = data.content || [];
        setOrders(orders);
        const totalSales = orders.reduce((sum, order) => sum + order.price, 0);
        setTotalSales(totalSales);
      })
      .catch(error => {
        console.error("Error fetching orders:", error);
        setSnackbarMessage("Errore durante il recupero delle vendite totali.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      });
  }, [token]);

  const fetchSalesData = useCallback(
    year => {
      fetch(`http://localhost:3001/orders/sales/${year}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(
              `Error fetching sales data: ${response.statusText}`
            );
          }
          return response.json();
        })
        .then(salesData => {
          setData(prevData => {
            const newData = prevData.filter(
              entry => entry[0] !== year.toString()
            );
            return [...newData, [year.toString(), salesData]];
          });
        })
        .catch(error => {
          console.error("Error fetching sales data:", error);
          setSnackbarMessage("Errore durante il recupero dei dati di vendita.");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
        });
    },
    [token]
  );

  const handleStatusChange = orderId => {
    setSelectedOrderId(orderId);
    setOpen(true);
  };

  const handleConfirm = () => {
    if (selectedOrderId) {
      fetch(`http://localhost:3001/orders/status/${selectedOrderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify("SHIPPED"),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(
              `Error updating order status: ${response.statusText}`
            );
          }
          return response.json();
        })
        .then(() => {
          setOpen(false);
          fetchOrders();
        })
        .catch(error => {
          console.error("Error updating order status:", error);
          setSnackbarMessage(
            "Errore durante l'aggiornamento dello stato dell'ordine."
          );
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
        });
    }
  };

  useEffect(() => {
    if (token) {
      fetchOrders();
      fetchTotal();
      [2022, 2023, 2024].forEach(year => fetchSalesData(year));
    }
  }, [fetchOrders, fetchTotal, fetchSalesData, token, currentPage]);

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="main d-flex mt-5">
      <div className="mt-5">
        <Header />
      </div>
      <div className="mt-5">
        <Sidebar />
      </div>

      <div className="right-content w-100">
        <h1 className="mb-5">Pannello di controllo</h1>
        <div className="row dashboardBoxWrapperRow">
          <div className="col-md-8">
            <div className="dashboardBoxWrapper d-flex">
              <DashboardBox
                color={["#c012e2", "#eb64fe"]}
                icon={<IoMdCart />}
                user={true}
              />
              <DashboardBox
                color={["#e1950e", "#f3cd29"]}
                icon={<GiStarsStack />}
                orders={true}
                grow={true}
              />
            </div>
          </div>

          <Col className="col-md-4 pl-0 topPart2">
            <div className="box graphBox">
              <div className="d-flex align-items-center w-100 bottomEle">
                <h5 className="text-white mb-0 mt-0">Vendite Totali</h5>
                <div className="ml-auto"></div>
              </div>

              <h3 className="text-white font-weight-bold">
                €{totalSales.toFixed(2)}
              </h3>

              <Chart chartType="PieChart" data={data} options={options} />
            </div>
          </Col>
        </div>

        <div className="card shadow border-0 p-3 mt-4">
          <h3 className="hd">
            {" "}
            {orders.length > 0 ? "Lista Ordini" : "Nessun ordine disponibile"}
          </h3>

          <div className="table-responsive mt-3">
            <table className="table table-bordered table-striped v-align">
              <thead className="thead-dark">
                <tr>
                  <th>UID</th>
                  <th>CREATED AT</th>
                  <th>CURRENCY</th>
                  <th>DESCRIPTION</th>
                  <th>INTENT</th>
                  <th>METHOD</th>
                  <th>PAYMENT METHOD</th>
                  <th>TOTAL</th>
                  <th>STATUS</th>
                </tr>
              </thead>

              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <span>#{order.id}</span>
                      </div>
                    </td>
                    <td>{order.createdAt}</td>
                    <td>{order.currency}</td>
                    <td>
                      <div style={{ width: "70px" }}>
                        <span>{order.description}</span>
                      </div>
                    </td>
                    <td>{order.intent}</td>
                    <td>{order.method}</td>
                    <td>{order.paymentMethod}</td>
                    <td>€{order.price}</td>
                    <td>
                      {order.status}
                      {order.status === "AWAITING_SHIPMENT" && (
                        <FaPen
                          onClick={() => handleStatusChange(order.id)}
                          style={{ cursor: "pointer", marginLeft: "10px" }}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="d-flex tableFooter">
              <Pagination
                page={currentPage}
                className="d-flex justify-content-center"
                count={totalPages}
                onChange={handlePageChange}
                renderItem={item => (
                  <PaginationItem
                    component={Link}
                    to={`/dashboard?page=${item.page}`}
                    {...item}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modale di conferma */}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Conferma</DialogTitle>
        <DialogContent>Vuoi contrassegnare come spedito?</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="primary">
            Annulla
          </Button>
          <Button onClick={handleConfirm} color="primary">
            Conferma
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar per feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Dashboard;
